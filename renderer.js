var traffic_direction = "incoming";
var excluded_models = [];
var tooltip_status;
var hover_ready = true; 
function mud_drawer(inp_json) {
  var graph = JSON.parse(JSON.stringify(inp_json));
  // var graph = inp_json;
  var svg = d3.select("svg");
  var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

  // // zoom , needs fix and clearance
  // var svg = d3.select("svg.svg")
  // .call(d3.zoom().on("zoom", function () {
  //    svg.attr("transform", d3.event.transform)
  // }));

  d3.select("svg").attr("height", height)
  d3.select("svg").attr("width", width)

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
      .id(
        function (d) { return d.id; })
      .distance(100)
      .strength(0.001))
    .force("charge", d3.forceManyBody()
      .strength(-200)
      .distanceMax(500)
      .distanceMin(50))
    .force("x", d3.forceX(function (d) {
      if (d.group == "01" || d.group == "02") {
        return 3.2 * (width) / 5
      }
      else if (d.group === "1") {
        return 4 * (width) / 5
      } else if (d.group === "2") {
        return 2.5 * (width) / 5
      } else if (d.group === "3") {
        return 1.8 * (width) / 5
      } else if (d.group === "4") {
        return 1 * (width) / 5
      } else {
        return 0 * (width) / 5
      }
    }).strength(1))
    .force("y", d3.forceY(function (d) {
      if (d.group == "01" || d.group == "02") {
        return 1.6 * (height) / 4
      }
      return height / 2;
    }).strength(0.1))
    // .force("center", d3.forceCenter((width) / 2, height / 2))
    .force("collision", d3.forceCollide().radius(35));

  // ######################################
  // # Read graph.json and draw SVG graph #
  // ######################################


  // d3.selectAll("svg > *").remove();
  var oig_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var orig_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;


  link_color = "black";
  link_hover_color = "green";

  for (var i = 0; i < graph.links.length; i++) {
    graph.links[i].linknum = 1;
    for (var j = 0; j < i; j++) {
      if ((graph.links[i].source == graph.links[j].source && graph.links[i].target == graph.links[j].target)
        ||
        (graph.links[i].source == graph.links[j].target && graph.links[i].target == graph.links[j].source)) {
        graph.links[i].linknum += 0.5;
      }
    }
  };

  var link = svg.append("g")
    .selectAll("path")
    .data(graph.links.filter(function (d) {
      if (allNodesObj.getNode(d.source).is_controlle_or_mycontroller()){ // it's enought to check the source because in the design the target is alwasy router or internet
          return (set_difference(get_devices_names(d['outgoing']['device:flow']), excluded_models).length > 0 ||
          set_difference(get_devices_names(d['incoming']['device:flow']), excluded_models).length > 0); 
      }
      return (
        (set_difference(get_devices_names(d['outgoing']['device:flow']), excluded_models).length > 0 ||
        set_difference(get_devices_names(d['incoming']['device:flow']), excluded_models).length > 0) && // this filters the mudfile links that are deselected in the selection menu
        !excluded_models.includes(d.source) && // also filter if the source or destination of the connection is in the exclusion list 
        !excluded_models.includes(d.target))
    }))
    .enter().append("svg:path")
    .attr("fill", "none")
    .attr("stroke", link_color)
    .attr("stroke-width", function (d) { return Math.sqrt(parseInt(1)); })
    .attr("src", function (d) { return d.source; })
    .attr("dst", function (d) { return d.target; })
    .attr("deviceflows", function (d) {
      return JSON.stringify(d[traffic_direction]["device:flow"]);
    });


  var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("a")
    .data(graph.nodes.filter(function (d) {
      var this_node_obj = allNodesObj.getNode(d.name);
      if (this_node_obj.is_controlle_or_mycontroller()){ // if it's a mycontroller of controller, the name does not neccessarily need to be in the contorller node 
        return (set_difference(this_node_obj.get_group1_devices('outgoing'), excluded_models).length > 0 ||
              set_difference(this_node_obj.get_group1_devices('incoming'), excluded_models).length > 0);
      }
      return !excluded_models.includes(this_node_obj.name) && 
              (set_difference(this_node_obj.get_group1_devices('outgoing'), excluded_models).length > 0 ||
              set_difference(this_node_obj.get_group1_devices('incoming'), excluded_models).length > 0);
    }))
    .enter().append("a")
    .attr("destination", '_blank');
  // the last two lines could probably be removed 

  node.call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

  node.append("image")
    .attr("xlink:href", function (d) {
      switch (d.group) {
        case "01":
            return "img/controller.svg";
        case "02":
          return "img/controller.svg";
        default:
          return ("img/group" + d.group + ".svg");
      }
    })
    .attr("width", function (d) {
      switch (d.group) {
        case "3":
          return 130;
        default:
          return 50;
      }
    })
    .attr("height", function (d) {
      switch (d.group) {
        case "3":
          return 130;
        default:
          return 50;
      }
    })
    .attr("x", function (d) {
      switch (d.group) {
        case "3":
          return -70;
        case "4":
          return -40;
        default:
          return -5;
      }
    })
    .attr("y", function (d) {
      switch (d.group) {
        case "3":
          return -50;
        default:
          return -20;
      }
    })
    .attr("fill", function (d) { return color(d.group); });

  node.append("text")
    .attr("font-size", "0.8em")
    .attr("dx", function (d) {
      switch (d.group) {
        case "01":
          return -40;
        case "02":
          return -40;
        case "1":
          return -15;
        case "2": //router logo x axis 
          return -30;
        case "3": // intenret logo x axis 
          return 5;
        case "4":
          return -(d.id.length * 7);
        default:
          return 5;
      }
    })
    // .attr("dy", ".35em")
    .attr("dy", function (d) {
      switch (d.group) {
        case "2": //router logo y axis 
          return 45;
        case "3": // intenret logo y axis 
          return -30;
        case "4":
          return -25;
        default:
          return -26;
      }
    })
    .attr("x", 8)
    .text(function (d) { 
      switch (d.group) {
        case "02":
          return "My-Controller: " + d.id
        case "3":
          return ; // for internet logo we don't need text 
        default: 
          return d.id;
      }
    });

  node.append("title")
    .text(function (d) { return d.id; });

  simulation
    .nodes(graph.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(graph.links);



  function ticked() {
    link
      .attr("d", linkArc);
    node
      .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")" });
  }

  function linkArc(d) {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = oig_width / d.linknum;
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  }

  function dragstarted(d) {
    if (d.group == '1' || d.group == '0') {
      d3.select(this).select('image').transition()
        .duration(100)
        .attr("width", 50)
        .attr("height", 50);
    }
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (d.group == '1' || d.group == '0') {
      d3.select(this).select('image').transition()
        .duration(100)
        .attr("width", 60)
        .attr("height", 60);
    }
    if (!d3.event.active) simulation.alphaTarget(0);
    // d.fx = null;
    // d.fy = null;
    d.fx = d3.event.x;
    d.fy = d3.event.y;

  }

  var div = d3.select("body")
    .append("div")
    .attr("id", "nodestooltip")
    .attr("class", "node-tooltip")
    .style("bottom", "0px")
    .style("left", "0px")
    .style("height", "0px")
    .style("width", "0px")
    .style("opacity", 0);




  node.on("mouseover", function (d) {

    d3.selectAll('*').interrupt();
    d3.selectAll('image').each(function (d) {
      if (d.group != "3" && d.group != "2"){
        d3.select(this)
          .attr('opacity', 1)          
          .attr("width", 50)
          .attr("height", 50);
        }
        else{// this is for router and internet nodes
          d3.select(this)
          .transition()
          .duration(500)
          .attr('opacity', 1);
        }
    });
    d3.selectAll('path').each(function (d) {
      d3.select(this)
      .attr('opacity', 1);
    });
    var hovered_node = d;
    if (d.group == '1' || d.group == '01' || d.group == '02') {
      d3.selectAll('image').each(function (d) {
        if (!hovered_node[traffic_direction].devices.includes(d.id) ) {
          d3.select(this)
            .transition()
            // .duration(100)
            .attr('opacity', 0.3);
        }
      });


      if (d[traffic_direction].links !== undefined) {
        d3.select(this).select('image').transition()
          .duration(500)
          .attr("width", 60)
          .attr("height", 60);
        if (traffic_direction == "incoming") {
          link_hover_color = 'red';
        }
        else if (traffic_direction == "outgoing") {
          link_hover_color = 'green';
        }

        var current_node_links = d[traffic_direction].links;
        var current_device = d.id
        d3.selectAll('path').each(function (d, i) {
          if (current_node_links.indexOf(d.uid) != -1) {
            var current_link = allLinksObj.getLink_by_uid(d.uid);
            if (d.source.name == current_link["source"] &&
              d.target.name == current_link["target"] &&
              get_devices_names(d[traffic_direction]["device:flow"]).includes(current_device)
            ) {
              totalLength = 20;
              devices = d[traffic_direction]["device:flow"];
              let direction = find_values_by_key(devices, current_device)[0];
              direction == "normal" ? link_direction_coefficient = 1 : link_direction_coefficient = -1;
              d3.select(this)
                .style("stroke", link_hover_color)
                .style("stroke-width", 2);
              d3.select(this)
                .attr("stroke-dasharray", totalLength/2 + " " + totalLength / 5)
                .attr("stroke-dashoffset", link_direction_coefficient * totalLength * 50)
                .transition()
                .duration(20000)
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);
            }
          }
          else {
            d3.select(this)
              // .transition()
              // .duration(100)
              .attr('opacity', 0.5);
          }
        })
      }
    }
    
  });


  node.on("mouseout", function (d) {


    if (d[traffic_direction].links !== undefined) {
      
      var current_node_links = d[traffic_direction].links;
      d3.selectAll('path').each(function (d, i) {
        if (current_node_links.indexOf(d.uid) != -1) {
          d3.select(this)
            .style("stroke", link_color)
            .style("stroke-width", 1);
          totalLength = 0;
          d3.select(this)
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength);
          
          // d3.select(this)
          // .attr('opacity', 1);
          //   .transition();
        }
        else {
          d3.select(this)
            .transition()
            .duration(500)
            .attr('opacity', 1);
        }
      }
      )
    }

    d3.selectAll('image').each(function (d) {
      if (d.group != "3" && d.group != "2"){
        
      d3.select(this)
        .transition()
        .duration(500)
        .attr('opacity', 1)
        .attr("width", 50)
        .attr("height", 50);
        
      }
      else { // this is for router and internet nodes
        d3.select(this)
        .transition()
        .duration(500)
        .attr('opacity', 1);
      }
    });
    
  });

  node.on("click", function (d) {

    if (d.group == "1" || d.group == "01" || d.group == "02") {
      // for showing the information:
      var clicked_node = allNodesObj.getNode(d.name);
      var clicked_node_protocols = clicked_node.get_protocols(traffic_direction);
      div
        .html(function () {
          let table = '<table id="ace_protocols">'
          if (traffic_direction == "outgoing") {
            table += "<tr>\
            <th>Destination</th>";
          }
          else if (traffic_direction == "incoming") {
            table += "<tr>\
            <th>Source</th>";
          }
          table += "<th>Transport</th>\
                    <th>Protocol</th>\
                    <th>Src Port</th>\
                    <th>Dst Port</th>\
                    </tr>"

          for (var protocol_idx in clicked_node_protocols) {
            let current_protocol = clicked_node_protocols[protocol_idx];

            if (!excluded_models.includes(current_protocol.target) && current_protocol.target != null ) { // protocols with null targets are just template protocols and will be filled later with the updater methods
              table += "<tr><td>" + current_protocol.target + "</td>";
              table += "<td>" + current_protocol.transport.join(', ') + "</td>";
              table += "<td>" + current_protocol.network.join(', ') + "</td>";
              table += "<td>" + current_protocol.src_port.join(', ') + "</td>";
              table += "<td>" + current_protocol.dst_port.join(', ') + "</td>";
              table += "</tr>"
            }
          }
          table += '</table>'
          return table;
        })
        // the next two lines is in case the table information is to be placed close to node instead of top left 
        //  .style("top", d.y - 50 + "px")
        //  .style("left", d.x - 600 + "px")
        .style("top", "10px")
        .style("left", "85px")
        .style("display","inline-block")
        .style("height", null)
        .style("width", null)
        .style("bottom", null);
      div.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip_status = 'just-clicked';
    }
    
  });



  // link.on("mouseover", function () { d3.select(this).style("stroke", link_hover_color); });
  // link.on("mouseout", function () { d3.select(this).style("stroke", link_color) });


}


var network = new Mud_Network();
var network_data;
require('electron').ipcRenderer.on('draw', (event, message) => {
  d3.selectAll("svg > *").remove();
  var remote = require('electron').remote;

  network.ready_to_draw = false;
  // let data = remote.getGlobal('sharedObj');
  let sharedobj = JSON.parse(remote.getGlobal('sharedObj'));
  for (var mudfile_idx in sharedobj) {
    network.add_mudfile(JSON.parse(sharedobj[mudfile_idx]));
  }
  // network.add_mudfile(JSON.parse(data));
  network.create_network()

  var interval = setInterval(function () {
    if (network.ready_to_draw == false) {
      return;
    }
    clearInterval(interval);
    network_data = network.get_nodes_links_json();
    mud_drawer(network_data);
  }, 100);
})


require('electron').ipcRenderer.on('resize', (event, message) => {
  width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  d3.select("svg").attr("height", height);
  d3.select("svg").attr("width", width);
})


require('electron').ipcRenderer.on('clearsvg', (event, message) => {
  d3.selectAll("svg > *").remove();
});


// this is for fading in/out select mud-file menu
var mudfile_select_menu_open = false;


$("#SelectMudFiles").click(function () {
  if (mudfile_select_menu_open == false) {
    $("#mudSelectionDiv").fadeIn("slow", function () {
      mudfile_select_menu_open = true;
    }).css("display","inline-block");;
  }
});

$("div:not(#mudSelectionDiv)").click(function () {
  if (mudfile_select_menu_open == true) {
    $("#mudSelectionDiv").fadeOut("slow", function () {
      mudfile_select_menu_open = false;
    });
  }
});

$("div:not(#nodestooltip)").click(function () {
  if (tooltip_status == 'ready-to-hide') {
    $("div[id='nodestooltip']").each(function () {
      $(this).animate({ opacity: 0 }, { duration: 100 })
        .animate({ bottom: "0px", left: "0px", height: "0px", width: "0px" })
    });
  }
  else if (tooltip_status = 'just-clicked') {
    tooltip_status = 'ready-to-hide';
  }
});

// selecting/unselecting a mudfile
$('body').on('click', 'input[id="mudcheckbox"]', function () {
  if ($(this).prop("checked")) {
    let item_idx = excluded_models.indexOf($(this).val());
    var checked_item_name = excluded_models[item_idx];
    
    excluded_models.splice(item_idx, 1);

    var checked_mud_controller = allNodesObj.getNode(checked_item_name).get_controller();
    if(checked_mud_controller != null){
      let controller_idx = excluded_models.indexOf(checked_mud_controller);
      excluded_models.splice(controller_idx, 1);
    }
  
    var checked_mud_mycontroller = allNodesObj.getNode(checked_item_name).get_mycontroller();
    if(checked_mud_mycontroller != null){
      let mycontroller_idx = excluded_models.indexOf(checked_mud_mycontroller);
      excluded_models.splice(mycontroller_idx, 1);
    }

    
  }
  else {
    var unchecked_mud_name = $(this).val(); 
    excluded_models.push(unchecked_mud_name);

    var unchecked_mud_controller = allNodesObj.getNode(unchecked_mud_name).get_controller();
    if(unchecked_mud_controller != null){
      excluded_models.push(unchecked_mud_controller);
    }
    
    var unchecked_mud_mycontroller = allNodesObj.getNode(unchecked_mud_name).get_mycontroller();
    if(unchecked_mud_mycontroller != null){
      excluded_models.push(unchecked_mud_mycontroller);
    }
  }
  d3.selectAll("svg > *").remove();
  drawer();
});

// used in mainWindow.html in refresh button
function drawer() {
  d3.selectAll("svg > *").remove();
  mud_drawer(network_data);
}


// used in mainWindow.html in refresh button
function set_incoming() {
  traffic_direction = "incoming";

  $("#button_outgoing").removeClass("outgoing-down");
  if (!$("#button_incoming").hasClass("incoming-down")) {
    $("#button_incoming").toggleClass("incoming-down");
  }
}

// used in mainWindow.html in refresh button
function set_outgoing() {
  traffic_direction = "outgoing";
  $("#button_incoming").removeClass("incoming-down");
  if (!$("#button_outgoing").hasClass("outgoing-down")) {
    $("#button_outgoing").toggleClass("outgoing-down");
  }

}

set_outgoing();

// used in about.html page
function opengithub() {
  const { shell } = require('electron');
  let url = "https://github.com/vafa-Andalibi/mudvisualizer";
  shell.openExternal(url);
}

function get_devices_names(arr) {
  let device_ids = [];
  for (var s in arr) {
    device_ids.push(Object.keys(arr[s])[0]);
  }
  return device_ids;
}


