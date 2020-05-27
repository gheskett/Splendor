# Splendor
Web variant of the popular board game Splendor

To run game API server:
 - Install Python 3.7+ with pip
 - Navigate to /server directory
 - Run `python3 -m pip install -r requirements.txt` to install required dependencies
 - Run `python3 main.py [Port]` (default port: 36251)

To run phaser for frontend client:
 - Install nodejs and npm
 - Under /phaser directory, run `npm install` to install dependencies
 - Run `npm start` to start phaser on local machine. Files will automatically be reloaded
   in the browser when changes are made to ensure a smooth development experience
 - `npm build` can be used to package the client once it is ready for deployment
