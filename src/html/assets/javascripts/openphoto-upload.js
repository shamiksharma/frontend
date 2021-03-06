/**
* Upload utility for OpenPhoto.
* Supports drag/drop with plupload
*/
OPU = (function() {
  var sortByFilename = function(a, b) {
    var aName = a.name;
    var bName = b.name;
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
  };
  return {
      init: function() {
        var uploaderEl = $("#uploader");
        if(uploaderEl.length == 0)
          return;
     
        if(typeof(uploaderEl.pluploadQueue) == 'undefined') {
          $("#uploader .insufficient").show();
          return;
        }

        uploaderEl.pluploadQueue({
            // General settings
            runtimes : 'html5',
            url : '/photo/upload.json?httpCodes=500,403,404', // omit 409 since it's somewhat idempotent
            max_file_size : '32mb',
            file_data_name : 'photo',
            //chunk_size : '1mb',
            unique_names : true,
     
            // Specify what files to browse for
            filters : [
                {title : "Photos", extensions : "jpg,jpeg,gif,png"}
            ],
     
            // Flash settings
            flash_swf_url : 'plupload.flash.swf',
            multipart_params:{
              crumb: $("form.upload input.crumb").val()
            },
            preinit: {
              BeforeUpload: function() {
                var uploader = $("#uploader").pluploadQueue();
                $(".upload-progress .total").html(uploader.files.length);
                $(".upload-progress .completed").html(uploader.total.uploaded+1);
                $(".upload-progress").slideDown('fast');
              },
              FilesAdded: function(uploader, files) {
                var queue = uploader.files.concat(files);
                queue.sort(sortByFilename);
                uploader.files = queue;
              },
              UploadComplete: function(uploader, files) {
                var i, file, failed = 0, total = 0;
                for(i in files) {
                  if(files.hasOwnProperty(i)) {
                    total++;
                    file = files[i];
                    if(file.status !== plupload.DONE)
                      failed++;
                  }
                }
                if(failed === 0) {
                  OP.Util.fire('upload:complete-success');
                } else {
                  OP.Util.fire('upload:complete-error');
                }

              },
              UploadFile: function() {
                var uploader = $("#uploader").pluploadQueue(), license, permission, tags, groups;
                license = $("form.upload select[name='license'] :selected").val();
                tags = $("form.upload input[name='tags']").val();
                permission = $("form.upload input[name='permission']:checked").val();
                // http://stackoverflow.com/a/6116631
                groups = $("form.upload input[name='groups[]']:checked").map(function () {return this.value;}).get().join(",");
                
                uploader.settings.multipart_params.license = license;
                uploader.settings.multipart_params.tags = tags;
                uploader.settings.multipart_params.permission = permission;
                uploader.settings.multipart_params.groups = groups;
              }
            }
        });

        OP.Util.on('submit:photo-upload', function(ev) {
          ev.preventDefault();
          var uploader = $("#uploader").pluploadQueue();
          if (typeof(uploader.files) != 'undefined' && uploader.files.length > 0) {
            uploader.start();
          } else {
            // TODO something that doesn't suck
            opTheme.message.error('Please select at least one photo to upload.');
          }
        });
      }
    };
}());
