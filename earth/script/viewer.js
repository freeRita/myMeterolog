window.onload = function () {
  var viewer = makeViewer();
  loadAndDraw(viewer);
};

/**
 * load the cesium earth.
 */
function makeViewer() {
  //created a cesium
  var viewer = new Cesium.Viewer('cesiumContainer', {
    animation: false,
    baseLayerPicker: false,
    geocoder: true,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    navigationInstructionsInitiallyVisible: false
  });
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(0, 90, 20000000.0)
  });

  setTimeout(function () {
    flyTo(viewer);
  }, 5000);

  return viewer;
}

/**
 * control the camera (fly to ...)
 * @param viewer
 */
function flyTo(viewer) {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(110, 35, 20000000.0)
  });
}

/**
 * load the data and draw it.
 * @param viewer
 */
function loadAndDraw(viewer) {
  //load text from a URL, setting a custom header
  Cesium.loadText('./assets/temp.txt', {
    'X-Custom-Header': 'data'
  }).then(function (text) {
    // this.data = text.split("\n");  //for compatibility
    var data = text.split("\n");  //for compatibility
    var lon = data.slice(0, 230);
    var lat = data.slice(230, 460);
    var temp = data.slice(460, 1150);
    var cmap = makeCmap('temperature');

    draw(viewer, lon, lat, temp, cmap);
  }).otherwise(function (error) {
    console.log(error);
  });
}

/**
 * draw the wrfout
 * @param viewer
 * @param lon
 * @param lat
 * @param temp
 * @param cmap
 */
function draw(viewer, lon, lat, temp, cmap) {
  var lonNum = 299;
  var latNum = 229;
  var timeNum = 3;
  var scene = viewer.scene;

  var start = new Date().getSeconds();
  var mprimitives = makePrimitive(latNum, lonNum, lon, lat, temp, cmap, timeNum);
  var end = new Date().getSeconds();
  console.log("make primitives use " + (end - start) + " seconds");

  for (var i = 0; i < timeNum; i++) {
    scene.primitives.add(mprimitives[i]);
  }

  setTimeout(function () {
    drawDynamic(mprimitives, timeNum)
  }, 5000);
}

/**
 * make timeNum primitives,exp:3 primitives
 * @param latNum
 * @param lonNum
 * @param lon
 * @param lat
 * @param temp
 * @param cmap
 * @param timeNum: the number of time level
 * @returns {Array}
 */
function makePrimitive(latNum, lonNum, lon, lat, temp, cmap, timeNum) {
  var mprimitive = [];
  for (var t = 0; t <= timeNum - 1; t++) {
    var instances = [];
    //230-1 not 230 because we use value of the next point minus this point on latitude to determine the height of this rectangle.
    for (var i = 0; i < latNum; i++) {
      var x = lon[i].split(/[ ]+/);
      var y1 = lat[i].split(/[ ]+/);
      var y2 = lat[i + 1].split(/[ ]+/);
      var v = temp[(latNum + 1) * t + i].replace(/\s/, "").split(/[ ]+/);
      //300-1 not 300 because we use value of the next point minus this point on longitude to determine the width of this rectangle.
      for (var j = 0; j < lonNum; j++) {
        var index = parseInt(v[j]);
        var geometryInstance = new Cesium.GeometryInstance({
          geometry: new Cesium.RectangleGeometry({
            rectangle: Cesium.Rectangle.fromDegrees(x[j], y1[j], x[j + 1], y2[j])
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromBytes(cmap[index][0], cmap[index][1], cmap[index][2], 130))
          }
        });
        instances.push(geometryInstance);
      }
    }

    mprimitive.push(new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance(),
      show: false,
      id: 'g' + t
    }));
  }

  return mprimitive;
}

/**
 * draw the data dynamically
 * @param mprimitives
 * @param timeNum
 */
function drawDynamic(mprimitives, timeNum) {
  var time = 0;
  setInterval(function () {
    var prev = time;
    time++;
    if (time >= timeNum) {
      time = 0;
    }
    mprimitives[time].show = true;
    mprimitives[prev].show = false;
  }, 1000);
}

/**
 * created a cmap
 * @param variable
 * @returns {*[]}
 */
function makeCmap(variable) {
  //colors for precipitation
  var precipitation = [
    [194, 195, 255],
    [131, 126, 249],
    [64, 61, 251],
    [2, 4, 252],
    [4, 49, 190],
    [4, 100, 122],
    [8, 145, 58],
    [34, 185, 14],
    [102, 207, 8],
    [170, 227, 12],
    [239, 249, 6],
    [254, 206, 2],
    [255, 136, 0],
    [255, 67, 3],
    [250, 0, 4]
  ];

  //colors for temperature
  var temperature = [
    [130, 32, 241],
    [1, 0, 163],
    [33, 52, 216],
    [36, 135, 247],
    [1, 193, 251],
    [172, 218, 254],
    [232, 249, 226],
    [255, 229, 84],
    [255, 170, 1],
    [254, 82, 0],
    [226, 0, 1],
    [170, 26, 26],
    [230, 100, 163]
  ];

  switch (variable) {
    case 'precipitation':
      return precipitation;
      break;
    case 'temperature':
      return temperature;
      break;
  }
}
