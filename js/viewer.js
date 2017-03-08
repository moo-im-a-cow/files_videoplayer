var videoViewer = {
	UI : {
		loadVideoJS: function() {
			if (this.videoJSLoaded) {
				return $.when();
			} else {
				this.videoJSLoaded = true;
				var stylePath = OC.filePath('plyr_videoplayer', 'css', 'plyr.css');
				$('head').append($('<link rel="stylesheet" type="text/css" href="' + stylePath + '"/>'));
				var scriptPath = OC.filePath('plyr_videoplayer', 'js', 'plyr.js');
				return $.getScript(scriptPath)
			}
		},
		videoJSLoaded: false,
		playerTemplate : '<video id="my_video_1" controls preload="auto" width="100%" height="100%" poster="'+OC.filePath('plyr_videoplayer', '', 'img')+'/poster.png">' +
		'<source type="%type%" src="%src%" />' +
		'</video>',
		show : function () {
			// insert HTML
			var overlay = $('<div id="videoplayer_overlay" style="display:none;"><div id="videoplayer_outer_container"><div id="videoplayer_container"><div id="videoplayer"></div></div></div></div>');
			overlay.appendTo('body');
			var playerView = videoViewer.UI.playerTemplate
								.replace(/%src%/g, escapeHTML(videoViewer.location));
			if (videoViewer.mime) {
				playerView = playerView.replace(/%type%/g, escapeHTML(videoViewer.mime));
			} else {
				playerView = playerView.replace(/type="%type%"/g, '');
			}
			$(playerView).prependTo('#videoplayer');
			// close when clicking on the overlay
			overlay.on("click", function(e) {
				if (e.target === this) {
					videoViewer.hidePlayer();
				}
			});
			// show elements
			overlay.fadeIn('fast');

			// initialize player
			var plyrvids = plyr.setup("#my_video_1");
			plyrvids[0].on('ready', function(event) {
				videoViewer.player = event.detail.plyr;
				// append close button to video element
				var closeButton = $('<a class="icon-view-close" id="box-close" href="#"></a>').click(videoViewer.hidePlayer);
				$("#videoplayer_container").append(closeButton);

				// autoplay
				videoViewer.player.play();

			});

		},
		hide : function() {
			$('#videoplayer_overlay').fadeOut('fast', function() {
				$('#videoplayer_overlay').remove();
			});
		}
	},
	mime : null,
	file : null,
	location : null,
	player : null,
	mimeTypes : [
		'video/mp4',
		'video/webm',
		'video/x-flv',
		'video/ogg',
		'video/quicktime',
		'video/x-matroska',
	],
	mimeTypeAliasses: {
		'video/x-matroska': 'video/webm' // chrome is a little kid that refuses to play mkv if it knows it's an mkv, webm uses the same container format
	},
	onView : function(file, data) {
		videoViewer.file = file;
		videoViewer.dir = data.dir;
		if ($('#isPublic').length){
			// No seek for public videos atm, sorry
			videoViewer.location = data.fileList.getDownloadUrl(file, videoViewer.dir);
		} else {
			videoViewer.location = OC.linkToRemote('webdav') + OC.joinPaths(videoViewer.dir, file);
		}
		videoViewer.mime = data.$file.attr('data-mime');
		if (videoViewer.mimeTypeAliasses.hasOwnProperty(videoViewer.mime)) {
			videoViewer.mime = videoViewer.mimeTypeAliasses[videoViewer.mime];
		}
		videoViewer.showPlayer();
	},
	showPlayer : function() {
		videoViewer.UI.loadVideoJS().then(function() {
			videoViewer.UI.show();
		});
	},
	hidePlayer : function() {
		if (videoViewer.player !== null && videoViewer.player !== false) {
			videoViewer.player.destroy();
			videoViewer.player = false;
			videoViewer.UI.hide();
		}
	},
	log : function(message){
		console.log(message);
	}
};

$(document).ready(function(){

	// add event to ESC key
	$(document).keyup(function(e) {
		if (e.keyCode === 27) {
			videoViewer.hidePlayer();
		}
	});

	if (typeof FileActions !== 'undefined') {
		for (var i = 0; i < videoViewer.mimeTypes.length; ++i) {
			var mime = videoViewer.mimeTypes[i];
			OCA.Files.fileActions.register(mime, 'View', OC.PERMISSION_READ, '', videoViewer.onView);
			OCA.Files.fileActions.setDefault(mime, 'View');
		}
	}

});
