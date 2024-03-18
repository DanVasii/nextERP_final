class Graph {
    constructor(vertices) {
        this.vertices = vertices;
        this.adjacencyList = new Map();
        for (const vertex of vertices) {
            this.adjacencyList.set(vertex, []);
        }
    }

    edgeExists(from, to){
        return (this.adjacencyList.get(from).indexOf(to) !== -1 || this.adjacencyList.get(to).indexOf(from) !== -1)
    }

    addEdge(from, to) {
        this.adjacencyList.get(from).push(to);
    }

    topologicalSortUtil(vertex, visited, stack) {
        visited.add(vertex);
        for (const adjacentVertex of this.adjacencyList.get(vertex)) {
            if (!visited.has(adjacentVertex)) {
                this.topologicalSortUtil(adjacentVertex, visited, stack);
            }
        }
        stack.push(vertex);
    }

    topologicalSort(startVertex) {
        const visited = new Set();
        const stack = [];

        this.topologicalSortUtil(startVertex, visited, stack);

        return stack.reverse();
    }
}

module.exports = Graph;