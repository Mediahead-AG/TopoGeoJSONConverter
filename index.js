process.stdin.resume();

var topojson = require('topojson');
var data = "";

process.stdin.on("data", function(chunk) {
    data = data + chunk;
});

process.stdin.on("end", function() {
    convertTopojsonToGeojson(data);
});




function convertTopojsonToGeojson(topojsonString) {
    try {
        var parsedTopojson = JSON.parse(topojsonString);
        var geJSONobj = new GeoJSON();
        //iterate over each key in the objects of the topojson
        for (var col in parsedTopojson.objects) {
            if (parsedTopojson.objects.hasOwnProperty(col)) {
                var gJ = topojson.feature(parsedTopojson, parsedTopojson.objects[col]);
                //merge with the existing GeoJSON Object
                geJSONobj.merge(gJ);
            }
        }
        //get the complete GeoJSON data
        var geojson = geJSONobj.getData();
        //Write it to the geojson text box
        process.stdout.write(JSON.stringify(geojson, null, 4));
    } catch (error) {
       // displayError('There was an unknown error converting your TopoJSON to GeoJSON. Sorry.');
        console.log(error, error.message);
    }
};

//function for building GeoJSON:
function GeoJSON() {
    var data;
    this.merge = function(input) {
        if (this.data == null) {
            this.data = input;
            return;
        }
        //Data already exists, we need to look at the type
        var type = this.data.type;
        switch (type) {
            case "FeatureCollection":
                //Featurecollection already exists. We just need to add the Features from the input
                // to the data's Features
                this.data.features = this.data.features.concat(this.getFeatures(input));
                break;
            case "Feature":
                // we need to create a new FeatureCollection & then concatenate the input
                var ob = {
                    "type": "FeatureCollection",
                    "features": [this.data]
                };
                //now set the data to this new FeatureCollection
                this.data = ob;
                this.data.features = this.data.features.concat(this.getFeatures(input));
                break;
                //For the 7 types of Geometry objects, We need to make the FeatureCollection & then concatenate
            case "Point":
            case "MultiPoint":
            case "LineString":
            case "MultiLineString":
            case "Polygon":
            case "MultiPolygon":
            case "GeometryCollection":
                var ob = {
                    "type": "FeatureCollection",
                    "features": this.getFeatures(this.data)
                };
                this.data = ob;
                this.data.features = this.data.features.concat(this.getFeatures(input));
                break;
            default:
                //UnExpected data type
                throw "UnExpected data type";
        }
    };
    this.getFeatures = function(geoJSON) {
        var type = geoJSON.type;
        switch (type) {
            case "FeatureCollection":
                return geoJSON.features;
            case "Feature":
                return [geoJSON];
                //For the 7 types of Geometry objects, just fall through to makeFeaturesArray object
            case "Point":
            case "MultiPoint":
            case "LineString":
            case "MultiLineString":
            case "Polygon":
            case "MultiPolygon":
            case "GeometryCollection":
                return this.makeFeaturesArray(geoJSON);
            default:
                //UnExpected Input; Return Empty Array
                return [];
        }
    };
    this.makeFeaturesArray = function(geom) {
        var feature = {
            "type": "Feature",
            "geometry": geom //Note: There can't be properties.
        };
        return [feature];
    };
    this.getData = function() {
        return this.data;
    };
}