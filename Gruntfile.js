module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'public/js/**/*.js', 'spec/**/*.js'],
      options: {
        globals: {
          jQuery: true
        }
      }
    },
    watch: {
      files: [
        '<%= jshint.files %>',
        'public/css/**/*.css',
      ],
      tasks: ['concat', 'concat_css']
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          'bower_components/angular/angular.js',
          'bower_components/angular-route/angular-route.js',
          'bower_components/plangular/dist/plangular.js',
          'public/js/app.js',
          'public/js/**/*.js',
        ],
        dest: 'public/application.js'
      }
    },
    concat_css: {
      options: {},
      all: {
        src: [
          'bower_components/basscss/css/basscss.css',
          'public/css/*.css'
        ],
        dest: 'public/application.css'
      },
    },
    go: {
      options:{
        // GOPATH: [process.env.GOPATH]
        GOPATH: ['../../../..'] // make this actually work :(
      },
      dev: {
        output: "sndcld",
        run_files: ["main.go"],
        run_flags: [
          '--port', ':3000',
          '--client-id', '1182e08b0415d770cfb0219e80c839e8',
        ]
      }
    },
    uglify: {
      my_target: {
        files: {
          'public/application.js': [
            '<%= concat.dist.src %>'
          ]
        }
      },
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      target: {
        files: {
          'public/application.css': ['<%= concat_css.all.src %>']
        }
      }
    },
    karma: {
      // e2e: {
      //   configFile: 'karma-e2e.conf.js',
      //   singleRun: true
      // },
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },
    // copy: {} // configure me
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-go');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-concat-css');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('hint', ['jshint']);
  grunt.registerTask('test', ['concat', 'jshint', 'karma']);
  grunt.registerTask('prod', ['uglify', 'cssmin', 'go:run:prod']);
  grunt.registerTask('prep', ['concat', 'cssmin']);
  grunt.registerTask('default', ['concat', 'cssmin', 'go:run:dev']);
};
