const ffmpeg = require('fluent-ffmpeg');
const fs = require ("fs")
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path');

module.exports.mergeFiles = (req, res) => {
  // Check if files are uploaded
  if (!req.files || !req.files['images'] || !req.files['video']) {
    return res.status(400).send('Both images and a video file must be uploaded');
  }
  const videoFile = req.files['video'][0].path; // Path to the uploaded video
  const images = req.files['images']; // Array of uploaded images
  const outputVideoPath = path.join(__dirname, 'uploads', `merged-${Date.now()}.mp4`); // Output file path
  const tempImageVideos = [];

  console.log(req.files)

  if (!images || images.length === 0) {
    return res.status(400).send('No images uploaded.');
  }
  // Function to process each image
  const processImages = (index) => {
    console.log(index,images)
    if (index >= images.length) {
        console.log('yes')
      concatenateVideos(); // Once all images are processed, concatenate
      return;
    }

    const imageFile = images[index].path;
    const tempImageVideo = path.join(__dirname, 'uploads', `image-${Date.now()}-${index}.mp4`);


    ffmpeg()
      .input(imageFile)
      .loop(5) // Loop the image for 10 seconds
      .outputOptions('-t', '5') // Set the duration to 10 seconds
      .size('1280x720') // Set the size
      .output(tempImageVideo) // Save the image video
      .on('end', () => {
        console.log(`Image video ${index} created successfully!`);
        tempImageVideos.push(tempImageVideo); // Store the path
        fs.unlinkSync(imageFile)
        processImages(index + 1); // Process the next image
      })
      .on('error', (err) => {
        console.error(`Error creating image video ${index}:`, err);
        res.status(500).send('Failed to create image video');
      })
      .run();
  };

  // Function to concatenate videos
  const concatenateVideos = () => {
    if(tempImageVideos.length === 0){
      return res.status(400).send('Images and video are not merged')
    }
    const ffmpegCommand = ffmpeg();

    tempImageVideos.forEach((video) => {
      ffmpegCommand.input(video);
    });

    ffmpegCommand.input(videoFile);

    // Build the filter string
    const filterInputs = tempImageVideos.map((_, index) => `[${index}:v]scale=1280:720,setsar=1[img${index}];`).join('');
    const videoInput = `[${tempImageVideos.length}:v]scale=1280:720,setsar=1[video];`;
    const concatInputs = tempImageVideos.map((_, index) => `[img${index}]`).join('') + `[video]concat=n=${tempImageVideos.length + 1}:v=1:a=0[v]`;

    ffmpegCommand
      .complexFilter(`${filterInputs}${videoInput}${concatInputs}`)
      .map('[v]')
      .outputOptions('-an') // Disable audio if not needed
      .output(outputVideoPath)
      .videoCodec('libx264')
      .on('end', () => {
        console.log('Final merged video created successfully!');
        res.sendFile(outputVideoPath, (err) => {
          // Cleanup temporary files
          tempImageVideos.forEach(file => fs.unlinkSync(file));

          fs.unlinkSync(videoFile); // Optionally, clean up the uploaded video as well
          if (err) {
            console.error('Error sending file:', err);
          }
        });
      })
      .on('error', (err) => {
        console.error('Error merging video:', err);
        res.status(500).send('Failed to merge video');
      })
      .run();
  };

  // Start processing images
  processImages(0);
};