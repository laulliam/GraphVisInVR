var express = require('express');
var router = express.Router();
var fs = require('fs')
var path = require('path')
// var cola = require('webcola')
// var nGraph = require('ngraph.graph');
// var createLayout = require('ngraph.forcelayout3D');

// let layout, g = nGraph();

// function getPGlayout(graph) {

//   let mapping = {};

//   graph.nodes.forEach(function (node, i) {
//     mapping[node.id] = i;
//   });

//   let invertKeyValues = obj =>
//     Object.keys(obj).reduce((acc, key) => {
//       acc[obj[key]] = key;
//       return acc;
//     }, {});

//   let mapping_ = invertKeyValues(mapping);

//   graph.links.forEach(function (link) {
//     link.source = mapping[link.source];
//     link.target = mapping[link.target];
//   });

//   let moduleData = {
//     "PGmodules": null,
//     "PGlinks": null
//   };

//   let d3cola = cola.d3adaptor();
//   let powerGraph;

//   d3cola.nodes(JSON.parse(JSON.stringify(graph.nodes))).links(JSON.parse(JSON.stringify(graph.links))).powerGraphGroups(function (d) {
//     powerGraph = d;
//   })
//     .start(10, 10, 10);

//   let modules = [];

//   powerGraph.groups.forEach(function (group) {
//     // group is an object

//     // add the current module
//     modules.push({
//       "id": "Group" + group.id,
//       "elements": {
//         "nodes": [],
//         "modules": []
//       }
//     });

//     // add the child nodes
//     if (group.leaves) {
//       group.leaves.forEach(function (leaf) {
//         modules[modules.length - 1].elements.nodes.push(leaf.id);
//       });
//     }

//     // add the child modules
//     if (group.groups) {
//       group.groups.forEach(function (childGrp) {
//         modules[modules.length - 1].elements.modules.push("Group" + childGrp.id);
//       });
//     }
//   });

//   moduleData.PGmodules = modules;

//   // // Get PG Links
//   let PGlinks = [];

//   powerGraph.powerEdges.forEach(function (Pedge) {
//     // add the power edge to PGlinks

//     PGlinks.push({
//       "source": isNaN(Pedge.source.id) ? Pedge.source.id : ("Group" + Pedge.source.id),
//       "target": isNaN(Pedge.target.id) ? Pedge.target.id : ("Group" + Pedge.target.id),
//     });

//   });

//   moduleData.PGlinks = PGlinks;
//   moduleData["nodes"] = graph.nodes;
//   moduleData["links"] = graph.links.map(d => {
//     return {
//       source: mapping_[d.source],
//       target: mapping_[d.target]
//     }
//   });

//   // graph.nodes.forEach(function (node) {
//   //   moduleData.nodes.push({
//   //     "id": node.id,
//   //     // "name": node.id,
//   //     // "group": node.group
//   //   });
//   // });

//   return moduleData;
// }

// function graphToRoutingGraph(graph) {

//   var routingGraph = {};

//   routingGraph.actualLinks = graph.links;
//   // Push the nodes
//   routingGraph.nodes = graph.nodes;
//   // mark each node as not routingNode

//   routingGraph.nodes.forEach(function (elem) {
//     elem.isRouting = false;
//   });

//   graph.PGmodules.forEach(function (elem) {
//     routingGraph.nodes.push({
//       id: elem.id,
//       // "group": "Routing",
//       isRouting: true
//     }); // Each module is a routing node
//   });

//   // Push the edges
//   routingGraph.links = graph.PGlinks;
//   graph.PGmodules.forEach(function (elem) {
//     var elemNodes = elem.elements.nodes;
//     var elemModules = elem.elements.modules;

//     // Edges from current module to child nodes
//     elemNodes.forEach(function (e) {
//       routingGraph.links.push({
//         "source": elem.id,
//         "target": e
//       });
//     });

//     // Edges from current module to child modules
//     elemModules.forEach(function (e) {
//       routingGraph.links.push({
//         "source": elem.id,
//         "target": e
//       });
//     });

//   });

//   // var reverseEdges = [];
//   // routingGraph.links.forEach (function (link) {
//   //     reverseEdges.push({
//   //         "source": link.source,
//   //         "target": link.target
//   //     });
//   // });
//   // reverseEdges.forEach (function (edge) {
//   //     routingGraph.links.push(edge);
//   // });

//   // everything done
//   return routingGraph;
// }

// function graphToRoutingGraphSplit(graph) {

//   let PGmodules = graph.PGmodules; // PG Modules
//   let PGlinks = graph.PGlinks; // PG edges
//   let graphNodes = graph.nodes; // Actual nodes
//   let graphLinks = graph.links; // Actual links

//   let Nodes = {};

//   // Add the routing nodes
//   PGmodules.forEach(function (module) {

//     if (!Nodes[module.id]) {
//       Nodes[module.id] = {
//         "isRouting": true,
//         "internal": {},
//         "external": {}
//       };
//     }

//     let elemNodes = module.elements.nodes;
//     let elemModules = module.elements.modules;

//     // Edges from current module to child nodes
//     elemNodes.forEach(function (e) {
//       Nodes[module.id].internal[e] = 1;
//     });

//     // Edges from current module to child modules
//     elemModules.forEach(function (e) {
//       Nodes[module.id].internal[e] = 1;
//       if (!Nodes[e]) Nodes[e] = {
//         "isRouting": true,
//         "internal": {},
//         "external": {}
//       };
//       Nodes[e].external[module.id] = 1;
//     });
//   });

//   // Add the actual nodes
//   graphNodes.forEach(function (node) {
//     Nodes[node.id] = {
//       "isRouting": false,
//       "internal": {},
//       "external": {}
//     };
//   })

//   // Computing external links
//   PGlinks.forEach(function (link) {
//     (Nodes[link.source].external)[link.target] = 1;
//     (Nodes[link.target].external)[link.source] = 1;
//   })

//   // Split the routing nodes having internal >= 2 and external >= 2
//   let splitedNodes = {};
//   let splitedLinks = [];

//   for (let id in Nodes) {
//     let node = Nodes[id];

//     if (!node.isRouting) {
//       // not a routing node
//       let targets = Object.keys(node.external);
//       targets.forEach(function (target) {
//         splitedLinks.push({
//           "source": id,
//           "target": target
//         });
//       });

//       splitedNodes[id] = 1;

//     } else {
//       // a routing node
//       let internalNodes = Object.keys(node.internal);
//       let externalNodes = Object.keys(node.external);

//       // if both >= 2 then split the node
//       if (internalNodes.length > 2 && externalNodes.length > 2) {

//         // split it
//         let node1 = {
//           "id": id + "#1"
//         };
//         let node2 = {
//           "id": id + "#2"
//         };

//         // push the nodes
//         splitedNodes[node1.id] = 2;
//         splitedNodes[node2.id] = 2;

//         // add the edges
//         internalNodes.forEach(function (target) {
//           splitedLinks.push({
//             "source": node1.id,
//             "target": target
//           });
//         });

//         externalNodes.forEach(function (target) {
//           splitedLinks.push({
//             "source": node2.id,
//             "target": target
//           })
//         });

//         splitedLinks.push({
//           "source": node1.id,
//           "target": node2.id
//         })
//       } else {
//         // no splitting required
//         // push the nodes
//         splitedNodes[id] = 2;

//         // add the edges
//         internalNodes.forEach(function (target) {
//           splitedLinks.push({
//             "source": id,
//             "target": target
//           });
//         });

//         externalNodes.forEach(function (target) {
//           splitedLinks.push({
//             "source": id,
//             "target": target
//           })
//         });

//       }
//     }
//   }

//   // done analysing the nodes
//   // clean edges
//   let newLinks = [];
//   splitedLinks.forEach(function (link) {
//     if (splitedNodes[link.target]) {
//       // valid link => add it to the links array
//       newLinks.push(link);
//     }
//   });

//   let nodeArr = [];

//   // console.log(graph.nodes.find(d=>d.id == '44').name);

//   for (let id in splitedNodes) {
//     nodeArr.push({
//       "id": id,
//       // "name": (id.indexOf('Group')) ? graph.nodes.find(d => d.id == id).name : id,
//       // "name":graph.nodes.find(d=>d.id == id) !== -1? graph.nodes.find(d=>d.id == id).name:id,
//       // "group": (splitedNodes[id] === 2) ? "Routing" : graph.nodes.find(d => d.id == id).group,
//       "isRouting": (splitedNodes[id] === 2)
//     });
//   }

//   return {
//     "nodes": nodeArr,
//     "links": newLinks,
//     "actualLinks": graphLinks
//   };
// }

// function routingToConfGraph(graph) {

//   // Nodes
//   let routingNodes = graph.nodes;

//   // Edges
//   let routingEdges = graph.links;

//   // Actual Edges (without the routing node)
//   let actualEdges = graph.actualLinks;

//   let mapping = {};

//   // constructing the graph
//   routingEdges.forEach(function (link) {
//     if (!mapping[link.source]) mapping[link.source] = {};
//     if (!mapping[link.target]) mapping[link.target] = {};

//     (mapping[link.source])[link.target] = 1;
//     (mapping[link.target])[link.source] = 1;
//   });

//   let dijkstra_graph = new Graph(mapping);
//   // console.log(dijkstra_graph);
//   //
//   // console.log(dijkstra(dijkstra_graph,"Brevet","Judge"));

//   let confluentEdges = [];

//   // for each actual edge find the shortest path in the routing graph and render it as a curve later
//   actualEdges.forEach((edge) => {

//     let path = dijkstra(dijkstra_graph, edge.source, edge.target)

//     if (path) {
//       // path = path.map(d => ('' + d).includes('Group') ? d : parseInt(d))
//       confluentEdges.push(path);
//     }
//   });

//   // everything done
//   return {
//     "nodes": routingNodes,
//     "links": routingEdges,
//     "confLinks": confluentEdges,
//     "actualEdges": actualEdges
//   };
// }

// function dijkstra(graph, node1, node2) {
//   return graph.findShortestPath(node1, node2);
// }

// var Graph = (function (undefined) {

//   var extractKeys = function (obj) {
//     var keys = [], key;
//     for (key in obj) {
//       Object.prototype.hasOwnProperty.call(obj, key) && keys.push(key);
//     }
//     return keys;
//   }

//   var sorter = function (a, b) {
//     return parseFloat(a) - parseFloat(b);
//   }

//   // eslint-disable-next-line no-unused-vars
//   var findPaths = function (map, start, end, infinity) {
//     infinity = infinity || Infinity;

//     var costs = {},
//       open = { '0': [start] },
//       predecessors = {},
//       keys;

//     var addToOpen = function (cost, vertex) {
//       var key = "" + cost;
//       if (!open[key]) open[key] = [];
//       open[key].push(vertex);
//     }

//     costs[start] = 0;

//     while (open) {
//       if (!(keys = extractKeys(open)).length) break;

//       keys.sort(sorter);

//       var key = keys[0],
//         bucket = open[key],
//         node = bucket.shift(),
//         currentCost = parseFloat(key),
//         adjacentNodes = map[node] || {};

//       if (!bucket.length) delete open[key];

//       for (var vertex in adjacentNodes) {
//         if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
//           var cost = adjacentNodes[vertex],
//             totalCost = cost + currentCost,
//             vertexCost = costs[vertex];

//           if ((vertexCost === undefined) || (vertexCost > totalCost)) {
//             costs[vertex] = totalCost;
//             addToOpen(totalCost, vertex);
//             predecessors[vertex] = node;
//           }
//         }
//       }
//     }

//     if (costs[end] === undefined) {
//       return null;
//     } else {
//       return predecessors;
//     }

//   }

//   var extractShortest = function (predecessors, end) {
//     var nodes = [],
//       u = end;

//     while (u !== undefined) {
//       nodes.push(u);
//       u = predecessors[u];
//     }

//     nodes.reverse();
//     return nodes;
//   }

//   var findShortestPath = function (map, nodes) {
//     var start = nodes.shift(),
//       end,
//       predecessors,
//       path = [],
//       shortest;

//     while (nodes.length) {
//       end = nodes.shift();
//       predecessors = findPaths(map, start, end);

//       if (predecessors) {
//         shortest = extractShortest(predecessors, end);
//         if (nodes.length) {
//           path.push.apply(path, shortest.slice(0, -1));
//         } else {
//           return path.concat(shortest);
//         }
//       } else {
//         return null;
//       }
//       start = end;
//     }
//   }

//   var toArray = function (list, offset) {
//     try {
//       return Array.prototype.slice.call(list, offset);
//     } catch (e) {
//       var a = [];
//       for (var i = offset || 0, l = list.length; i < l; ++i) {
//         a.push(list[i]);
//       }
//       return a;
//     }
//   }

//   var Graph = function (map) {
//     this.map = map;
//   }

//   Graph.prototype.findShortestPath = function (start, end) {
//     if (Object.prototype.toString.call(start) === '[object Array]') {
//       return findShortestPath(this.map, start);
//     } else if (arguments.length === 2) {
//       return findShortestPath(this.map, [start, end]);
//     } else {
//       return findShortestPath(this.map, toArray(arguments));
//     }
//   };

//   Graph.findShortestPath = function (map, start, end) {
//     if (Object.prototype.toString.call(start) === '[object Array]') {
//       return findShortestPath(map, start);
//     } else if (arguments.length === 3) {
//       return findShortestPath(map, [start, end]);
//     } else {
//       return findShortestPath(map, toArray(arguments, 1));
//     }
//   };

//   return Graph;

// })();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/abnormal_1013_S_5071', function (req, res, next) {

  fs.readFile(path.join(__dirname, "../public/data/brain/abnormal_1013_S_5071.json"), "utf-8", function (err, data) {
    if (err) {
      res.send("文件读取失败");
    } else {

      data = JSON.parse(data)
      data.links = data.links.filter(d=> d.value > 0.8)
      res.json(data)

    }
  })

})

router.get('/normal_1_S_0071', function (req, res, next) {

  fs.readFile(path.join(__dirname, "../public/data/brain/normal_1_S_0071.json"), "utf-8", function (err, data) {
    if (err) {
      res.send("文件读取失败");
    } else {

      data = JSON.parse(data)
      data.links = data.links.filter(d=> d.value > 0.8)
      res.json(data)

    }
  })

})


router.get('/social_graph_contact', function (req, res, next) {

  fs.readFile(path.join(__dirname, "../public/data/social/friendship/Contact-network.json"), "utf-8", function (err, data) {
    if (err) {
      res.send("文件读取失败");
    } else {

      res.json(JSON.parse(data))

    }
  })

})

router.get('/social_graph_friendship', function (req, res, next) {

  fs.readFile(path.join(__dirname, "../public/data/social/friendship/Friendship-network.json"), "utf-8", function (err, data) {
    if (err) {
      res.send("文件读取失败");
    } else {

      res.json(JSON.parse(data))

    }
  })

})

router.get('/social_graph_facebook', function (req, res, next) {

  fs.readFile(path.join(__dirname, "../public/data/social/friendship/Facebook-network.json"), "utf-8", function (err, data) {
    if (err) {
      res.send("文件读取失败");
    } else {

      res.json(JSON.parse(data))

    }
  })

})

router.get('/social_graph_sensor', function (req, res, next) {

  fs.readFile(path.join(__dirname, "../public/data/social/friendship/sensor-network.json"), "utf-8", function (err, data) {
    if (err) {
      res.send("文件读取失败");
    } else {

      res.json(JSON.parse(data))

    }
  })

})

router.get('/cite_graph', function (req, res, next) {

  let group = req.query.group

  fs.readFile(path.join(__dirname, "../public/data/citation/vis-coauth-graph-random.json"), "utf-8", function (err, data) {
    if (err) {
      res.send("文件读取失败");
    } else {

      res.json(JSON.parse(data))

    }
  })
})

router.get('/cite_graph_test', function (req, res, next) {

  let group = req.query.group

  fs.readFile(path.join(__dirname, "../public/data/citation/IEEE VIS-1990-2020.json"), "utf-8", function (err, data) {
    if (err) {
      res.send("文件读取失败");
    } else {

      res.json(JSON.parse(data))

    }
  })
})

router.get('/test', function (req, res, next) {

  let group = req.query.group

  fs.readFile(path.join(__dirname, "../public/data/miserables.json"), "utf-8", function (err, data) {
    if (err) {
      res.send("文件读取失败");
    } else {

      res.json(JSON.parse(data))

    }
  })
})

module.exports = router;
