'use strict';

var es = require('event-stream');
var union = require("lodash.union");
var vfs = require('vinyl-fs');
var through2 = require('through2');
var gutil = require('gulp-util');
var sassGraph = require('sass-graph');
var PLUGIN_NAME = 'gulp-sass-inheritance-plus';

var stream;

function gulpSassInheritance(options) {
    options = options || {};

    var files = [];
    var filesPaths = [];
    var graph;

    function writeStream(currentFile) {
        if (currentFile && currentFile.contents.length) {
            files.push(currentFile);
        }
    }

    function check(_filePaths) {
        _filePaths.forEach(function(filePath) {
            filesPaths = union(filesPaths, [filePath]);
            if (graph.index && graph.index[filePath]) {
                var fullpaths = graph.index[filePath].importedBy;

                if (options.debug) {
                    console.log('File', filePath);
                    console.log(' - importedBy', fullpaths);
                }
                filesPaths = union(filesPaths, fullpaths);
            }
            if (fullpaths)
                return check(fullpaths);
        });
        return true;
    }

    function endStream() {
        if (files.length) {

            graph = sassGraph.parseDir(options.dir, options);

            check(files.map(function(item) { return item.path }));

            vfs.src(filesPaths)
                .pipe(es.through(
                    function(f) {
                        stream.emit('data', f);
                    },
                    function() {
                        stream.emit('end');
                    }
                ));
        } else {
            stream.emit('end');
        }
    }

    stream = es.through(writeStream, endStream);

    return stream;
};

module.exports = gulpSassInheritance;