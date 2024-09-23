const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path');

module.exports.mergeFiles = (req, res) => {
  if (!req.files || !req.files['image'] || !req.files['video']) {
    return res.status(400).send('Both image and video files must be uploaded');
  }

  const imageFile = req.files['image'][0].path; // Path to the uploaded image
  const videoFile = req.files['video'][0].path; // Path to the uploaded video
  const outputVideoPath = path.join(__dirname, 'uploads', `merged-${Date.now()}.mp4`); // Output file path

  // First, turn the image into a 10-second video
  const tempImageVideo = path.join(__dirname, 'uploads', `image-${Date.now()}.mp4`);

  ffmpeg()
    .input(imageFile) // Add the image input
    .loop(10) // Loop the image for 10 seconds
    .outputOptions('-t', '10') // Set the duration of the image video to 10 seconds
    .size('1280x720') // Set the size of the image video
    .output(tempImageVideo) // Save the image video
    .on('end', () => {
      console.log('Image video created successfully!');

      // Now concatenate the image video and the uploaded video
      ffmpeg()
        .input(tempImageVideo) // Image video (10 seconds)
        .input(videoFile) // The actual video file
        .complexFilter([
          '[0:v]scale=1280:720,setsar=1[image]; [1:v]scale=1280:720,setsar=1[video]; [image][video]concat=n=2:v=1:a=0[v]'
        ])
        .map('[v]') // Specify the output video stream
        .output(outputVideoPath) // Output to the file
        .videoCodec('libx264') // Set the video codec
        .on('end', () => {
          console.log('Final merged video created successfully!');
          res.sendFile(outputVideoPath); // Send the generated video back to the frontend
        })
        .on('error', (err) => {
          console.error('Error merging video:', err);
          res.status(500).send('Failed to merge video');
        })
        .run();
    })
    .on('error', (err) => {
      console.error('Error creating image video:', err);
      res.status(500).send('Failed to create image video');
    })
    .run();
};
