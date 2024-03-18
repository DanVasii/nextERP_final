const mongo = require("../managers/mongoDB");
const ERRORS = require("../errors");
const { ObjectId, ConnectionCheckOutFailedEvent } = require("mongodb");
const mysql = require("../managers/mysql");
const pluralize = require("pluralize");
const Graph = require("../graph");

async function save_diagram(name, json, companyId, image, sheets_included){
    let connection = await mongo.getConnection();

    if (connection){
        //check if we have this name already used by this companyId
        let exists = await connection.db("nextERP").collection("diagrams").findOne({name});

        if (exists){
            return {success: false, body: "A diagram called "+name+" already exists!"};
        }else{
            for (let index = 0;index < sheets_included.length; index++){
                sheets_included[index] = new ObjectId(sheets_included[index]);
            }
            //save 
            connection.db("nextERP").collection("diagrams").insertOne({
                name,
                body: json,
                companyId,
                image,
                sheets_included
            });
            return {success: true};
        }
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function get_diagrams(companyId){
    let connection = await mongo.getConnection();

    if (connection){

        let diagrams = await connection.db("nextERP").collection("diagrams").aggregate([
            {
              $match: {
                companyId: companyId
              }
            },
            {
              $lookup: {
                from: "sheets",
                localField: "sheets_included",
                foreignField: "_id",
                as: "sheets_data"
              }
            },
            {
              $unwind: "$sheets_data"
            },
            {
                $group: {
                  _id: "$_id",
                  sheets_names: { $push: "$sheets_data.sheetName" },
                  name: { $first: "$name" },
                  body: {$first: "$body"},
                  image: { $first: "$image" },
                  companyId: { $first: "$companyId"}
                }
              },
            {
              $project: {
                _id: 0,
                sheets_names: 1,
                name: 1,
                body: 1,
                image: 1,
                companyId: 1
              }
            }
          ]).toArray();
          
        return {success: true, data: diagrams};
    }else{
        return ERRORS.MONGO_DB_CONNECTION;
    }
}

async function get_user_name(companyIds){
    let connection = await mysql.getConnectionWrapper();
    if (connection){

        let fake_promise = new Promise((res, rej)=>{
            connection.query("SELECT id, name from users where id in (?)",[companyIds.join(",")],(err, response, fields)=>{
                mysql.release(connection);
                if (err){
                    res({success: false});
                }else{
                    res({success: true, data: response});
                }
            })
        });

        return await fake_promise;
    }else{
        return ERRORS.MYSQL_DB_CONNECTION;
    }
}

async function get_sheet_names(sheet_ids){
    let connection = await mongo.getConnection();

    if (connection !== null) {

      //convert to objectId
      sheet_ids = mongo.array_to_objectIds(sheet_ids);

      try {
        let response = await connection.db("nextERP").collection("sheets").find({
          _id: {
            $in: sheet_ids
          }
        }).toArray();

        return { success: true, data: response };
      } catch (e) {
        return ERRORS.MONGO_DB_QUERY;
      }

    } else {
      return ERRORS.MONGO_DB_CONNECTION;
    }
} 

async function get_col_dataType(column_uuid, sheet_id){
  let connection = await mongo.getConnection();

  if (connection !== null){
    try{
      let response = await connection.db("nextERP").collection("headers").findOne({uuid: column_uuid, sheetId: new ObjectId(sheet_id)});

      if (response){
        return {success: true, data: response.colType};
      }else{
        return {success: false};
      }
    }catch(e){
      console.log(e);
      return ERRORS.MONGO_DB_QUERY;
    }
  }else{
    return ERRORS.MONGO_DB_CONNECTION;
  }
}

async function get_data_array(sheet_id, column_uuid){
  let connection = await mongo.getConnection();

  if (connection !== null){

    try{  

      let colType = await get_col_dataType(column_uuid, sheet_id);
      if (colType?.success === true){

        let response = await connection.db("nextERP").collection("cells").find(
          {
            uuid: column_uuid,
            sheetId: new ObjectId(sheet_id)
          },{
            projection:{
              value: 1
            }
          }
        ).toArray();
  
        return {success: true, data: response, colType: colType.data};

      }else{
        return {success: false};
      }

    }catch(e){
      console.log(e);
      return ERRORS.MONGO_DB_QUERY;
    }

  }else{
    return ERRORS.MONGO_DB_CONNECTION;
  }
}

async function get_sheet_headers(sheet_ids){
  let connection = await mongo.getConnection();

  if (connection !== null){
    try{
      sheet_ids = mongo.array_to_objectIds(sheet_ids);

      let response = await connection.db("nextERP").collection("headers").aggregate([
          {
              $match:{
                sheetId: {
                  $in: sheet_ids
                }
            }
          },
          {
            $lookup:{
              from: "sheets",
              localField: "sheetId",
              foreignField: "_id",
              as: "sheetData"
            }
          },
          {
            $unwind: "$sheetData"
          },
          {
            $project:{
              _id: 1,
              sheetName: "$sheetData.sheetName",
              name: 1,
              sheetId: 1,
              uuid: 1
            }
          }
      ]).toArray();

      if (response){
        return {success: true, data: response};
      }else{
        return {success: false};
      }

    }catch(e){
      console.log(e);
      return ERRORS.MONGO_DB_QUERY;
    }
  }else{
    return ERRORS.MONGO_DB_CONNECTION;
  }
}

async function smart_relations(previous, current){
  if (previous.length == 1){
    return {success: true};
  }
    let response = await get_sheet_headers([...previous, current]);
    if (response?.success == true){
        //filter for current now 
      let current_headers = response.data.filter((header)=>{
        return header.sheetId == current
      });
      

      //response.data should contain the other 
      response.data = response.data.filter((header)=>{
        return header.sheetId != current
      });

      let realtions = [];
      current_headers.forEach((current_header)=>{
        //search the rest of headers if we have a similar like current_header
          for (let relation_header of response.data){

              let sanitized_current, sanitized_header;

              //check ras 
              sanitized_current = current_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
              sanitized_header = relation_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');

              if (sanitized_current == sanitized_header){
                  realtions.push([current_header.uuid, relation_header.uuid]);
                  break;
                }

              //now check by including the sheet name 
              sanitized_current = current_header.sheetName + current_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
              sanitized_header = relation_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');

              if (sanitized_current == sanitized_header)
              {
                realtions.push([current_header.uuid, relation_header.uuid]);
                break;
              }

              //now check by including the sheet name 
              sanitized_current = pluralize.singular(current_header.sheetName) + current_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
              sanitized_header = relation_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
             
              if (sanitized_current == sanitized_header)
              {
                realtions.push([current_header.uuid, relation_header.uuid]);
                break;
              }

              //check for other sheet 
              //now check by including the sheet name 
              sanitized_current = current_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
              sanitized_header = relation_header.sheetName + relation_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
             
              if (sanitized_current == sanitized_header)
              {
                realtions.push([current_header.uuid, relation_header.uuid]);
                break;
              }

              //now check by including the sheet name 
              sanitized_current = current_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
              sanitized_header = pluralize.singular(relation_header.sheetName) + relation_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
           
              if (sanitized_current == sanitized_header)
              {
                realtions.push([current_header.uuid, relation_header.uuid]);
                break;
              }

              //now check for both
              sanitized_current = pluralize.singular(current_header.sheetName) + current_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
              sanitized_header = pluralize.singular(relation_header.sheetName) + relation_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
           
              if (sanitized_current == sanitized_header)
              {
                realtions.push([current_header.uuid, relation_header.uuid]);
                break;
              }

              //now check for both plural
              sanitized_current = current_header.sheetName + current_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
              sanitized_header = relation_header.sheetName + relation_header.name.toLowerCase().replaceAll(" ", "").replaceAll(/[^\w\s]/g, '');
          
              if (sanitized_current == sanitized_header)
              {
                realtions.push([current_header.uuid, relation_header.uuid]);
                break;
              }

          }
      })
      return {success: true, data: realtions};
    }else{
      return {success: false}
    }
}

async function get_relation_type(column1, column2){

  let connection = await mongo.getConnection();

  if (connection !== null){
    try{  
      
      let response = await connection.db("nextERP").collection("cells").find({
        $or: [
          {uuid: column1},
          {uuid: column2}
        ],
        value: { $ne: "" }
      }).project({value: 1, uuid: 1}).limit(2000).toArray();

      if (response){

        let col1 = response.filter((resp)=>resp.uuid == column1);
        let col2 = response.filter((resp)=>resp.uuid == column2);

          const values1 = col1.map(obj => obj.value);
          const values2 = col2.map(obj => obj.value);
        
          const uniqueValues1 = new Set(values1);
          const uniqueValues2 = new Set(values2);
        
          const commonValues = [...uniqueValues1].filter(value => uniqueValues2.has(value));

          console.log(commonValues);
          console.log(column1);
        
          if (commonValues.length != 0) {

            const relations = commonValues.map((commonValue)=>{
              const count1 = values1.filter(value => value === commonValue).length;
              const count2 = values2.filter(value => value === commonValue).length;
          
              if (count1 === 1 && count2 === 1) {
                //one to one 
                return 1;
              } else if (count2 === 1) {
                //many to one 
                return 3;
              } else if (count1 === 1) {
                //one to many
                return 2;
              } else {
                //many to many
                return 4;
              }
            });

            let final_relation = 0, has2 = false, has3 = false;

            relations.forEach((rel)=>{
              if (rel > final_relation){
                final_relation = rel;
              }
              
              if (rel == 2){
                has2 = true;
              }

              if (rel == 3){
                has3 = true;
              }
            })
            
            return {success: true, data: (has2 == true && has3 == true) ? 4 : final_relation}
          } else {
            return {success: true, data: 0};
          }
        

      }else{
        return {success: false};
      }
    }catch(e){
      console.log(e);
      return ERRORS.MONGO_DB_QUERY;
    }
  }else{
    return ERRORS.MONGO_DB_CONNECTION;
  }
}

async function get_headers(sheet_id){
  let connection = await mongo.getConnection();

  if (connection !== null){

    try{
      let response = await connection.db("nextERP").collection("headers").find({sheetId: new ObjectId(sheet_id)}).toArray();
      if (response){
        return {success: true, data: response};
      }else{
        return {success: false};
      }
    }catch(e){
      return ERRORS.MONGO_DB_QUERY;
    }

  }else{
    return ERRORS.MONGO_DB_CONNECTION;
  }
}

async function get_values(sheet_id, page){
  let connection = await mongo.getConnection();

  if (connection != null){
    try{

      let response = await connection.db("nextERP").collection("cells").aggregate([
        {
          $match: {
            sheetId: new ObjectId(sheet_id)
          }
        },
        {
          $group: {
            _id: '$rowId',
            data: { $push: '$$ROOT' }
          }
        }
      ]).sort({_id: 1}).limit(30).skip((page - 1) * 30).toArray();

      if (response){
        return {success: true, data: response};
      }else{
        return ERRORS.MONGO_DB_QUERY;
      }
    }catch(e){
      console.log(e);
      return ERRORS.MONGO_DB_QUERY;
    }
  }else{
    return ERRORS.MONGO_DB_CONNECTION;
  }
}

async function get_data_from_sheet_relational(sheet_id, relations, selected_list, matchData){
  
  if (selected_list[sheet_id])
  {
    
    return {success: true, data: []};

  }else{
    let connection = await mongo.getConnection();

    if (connection){


      //we should prepare the data for the aggregation

      const shouldEqual = {};
      
      for (const relation_sheet of Object.keys(relations)){


        if (matchData[relation_sheet] && matchData[relation_sheet].length != 0){
          //loop through the data and add to the should equal
     
          matchData[relation_sheet].forEach((row_to_match)=>{
            //the columns to be matched
            row_to_match.data.forEach((to_match)=>{
              for (const relation_array of relations[relation_sheet])
              {
                if (relation_array.indexOf(to_match.uuid) != -1){
                  //ok we can add 
                  let fake_clone = [...relation_array];
                  fake_clone.splice(relation_array.indexOf(to_match.uuid), 1);

                  if (shouldEqual[fake_clone[0]] === undefined)
                    shouldEqual[fake_clone[0]] = [];

                    if (typeof to_match.value === "number")
                      shouldEqual[fake_clone[0]].push(to_match.value);
                    else  
                      shouldEqual[fake_clone[0]].push(to_match.value.toString().trim());

                }
              }

            })

           })

        }
      }

      if (Object.keys(shouldEqual).length == 0){
        return {success: false};
      }

      let mongo_query = {
                $and: [
                    {
                        $and: [
                          {
                            value: {
                              $ne: ""
                            }
                          }
                        ]
                    },
                    {
                      sheetId: new ObjectId(sheet_id)
                    }
                ]
        };

      for (const uuid_to_match of Object.keys(shouldEqual)){
        mongo_query.$and[0].$and.push({
          uuid: uuid_to_match,
          value: {
            $in: shouldEqual[uuid_to_match]
          }
        })
      }
      //try catch 

      try{
        let response = await connection.db("nextERP").collection("cells").find(mongo_query).project({rowId: 1, uuid: 1}).toArray();

        console.log("First query: ");
        console.log(response);

        if (response){

          let rowIds = [];

          response.forEach((resp)=>{
            rowIds.push(resp.rowId);
          })

          let aggregate_query = [
            {
              $lookup: {
                from: 'headers',
                localField: 'uuid',
                foreignField: 'uuid',
                as: 'header_info'
              }
            },
            {
              $unwind: '$header_info'
            },
            {
              $match: {
                rowId: {
                  $in: rowIds
                },
                sheetId: new ObjectId(sheet_id)
              }
            },
            {
              $project: {
                value: 1, // Include fields from the cells collection
                uuid: 1,
                rowId: 1,
                colName: '$header_info.name', // Include the name field from the headers collection
                colType: '$header_info.colType'
              }
            },
            {
              $group: {
                _id: '$rowId',
                data: { $push: '$$ROOT' }
              }
            }
          ];

          response = await connection.db("nextERP").collection("cells").aggregate(aggregate_query).toArray();

          console.log(response);

          if (response){

            
              
              for (const response_row of response){
                response_row._count = helper_count_how_many_matches(shouldEqual, response_row.data);              
              }

            return {success: true, data: response};
          }else{
            return {success: false};
          }
        }else{
          return {success: false};
        }

      }catch(e){
        console.log(e);
        return {success: false};
      }
    }else{
      return ERRORS.MONGO_DB_CONNECTION;
    }
  }

}

function helper_count_how_many_matches(shouldEqual, cells){
  let matches = -1;

  for (const should_match_uuid of Object.keys(shouldEqual)){
    //search for this uuid 
    for (const cell_data of cells){
      if (cell_data.uuid == should_match_uuid)
      {
        //get how many times 
        let aux = countOccurrences(shouldEqual[should_match_uuid], cell_data.value);

        if (matches == -1){
          matches = aux;
        }else{
          matches = Math.min(matches, aux);
        }
      }
    }
  }

  return matches;
}

function countOccurrences(arr, value) {
  return arr.reduce((count, currentValue) => {
    return count + (currentValue === value ? 1 : 0);
  }, 0);
}

async function get_relational_data(sheets, selected, relations, main_sheet, main_sheet_data){
  //we should only get data for the sheets that do not have nothing selected
  //why? because one you select a row, this means you want the other tables to be updated with data based on relations
  const is_selected = {};
  for (const sheet_id of sheets){
    is_selected[sheet_id] = selected[sheet_id] !== undefined;
  }

  let parsed_data = {};
  parsed_data[main_sheet] = main_sheet_data;

  //we cant just parse data in a linear way, we need a topological sort to get the data
  //so create the graph first 
  let sheets_graph = new Graph(sheets);

  for (const main_relation_sheet of Object.keys(relations)){
    for (const relation_sheet of Object.keys(relations[main_relation_sheet]))
    {
      if (!sheets_graph.edgeExists(main_relation_sheet, relation_sheet))
      {
        sheets_graph.addEdge(main_relation_sheet, relation_sheet);
      }
    }
  }

  let topological = sheets_graph.topologicalSort(main_sheet);

  //now parse by this order 
  for (const sheet_id of topological){

    if (parsed_data[sheet_id] === undefined){
      let sheet_data_response = await get_data_from_sheet_relational(sheet_id, relations[sheet_id], is_selected, parsed_data);

      if (sheet_data_response?.success === true){
        parsed_data[sheet_id] = sheet_data_response.data;
      }
    }
  }

  delete parsed_data[main_sheet];
  return {success: true, data: parsed_data};

}

module.exports = {
    save_diagram, get_diagrams, get_user_name, get_sheet_names, get_data_array, smart_relations, get_relation_type, get_headers, get_values, get_relational_data
}