# SETTING UP THE PROJECT ON LOCAL WEB SEVER
___
## Have Python installed?
### If yes, follow the guidelines mentioned below for setting up the project using Python
The root folder of our project has `index.html` file.
- Open terminal/command prompt and navigate to cloned repository folder in your machine (i.e where `index.html` is present)

- Execute the following command for lower versions of Python i.e 2.x  version:

        python -m SimpleHttpServer 1337
        
     
- Execute the following command for Python version 3.x and above:
  
        python3 -m http.server 1337
        
      
   
- Open http://localhost:1337/index.html in your browser.
- You should see something like 
        
        Serving HTTP on 0.0.0.0 port 1337(http://0.0.0.0:1337/) ...
        
        
 ## Have Python installed?
 ### If yes, follow the guidelines mentioned below for setting up the project using Npm
 - Open terminal/command prompt and install `http-server` module globally on your machine.Execute:
 
          npm install http-server -g
          
 - Start a web server from a directory containing static website files.Change to the directory containing your static web files (e.g. html, javascript, css etc) in the command line window, e.g:
 
          cd \Desktop\LatexGo
         
 - Start the server with this command:
 
        http-server
        
 - You should see something like the following:
 
        Starting up http-server, serving ./
        Available on:
          http://192.168.0.5:8080
          http://127.0.0.1:8080
        Hit CTRL-C to stop the server


### Refer to this [link](https://discussions.apple.com/docs/DOC-3083) for setting up project on Mac Os.



