# Quick Start
* In Terminal create tunnel then launch server:
- ssh -L 8080:localhost:8080 <remote-host>
- code-server --auth none

* In Browser:
- Go To localhost:8080
		
---

# Full Instructions

## Install VSCode Server

In order to remotely edit files on the EC2 instance using Visual Studio Code, you'll need to install the Visual Studio Code server on the EC2 instance. The Visual Studio Code server allows you to remotely access the Visual Studio Code editor from your local machine.
    
* To install the Visual Studio Code server on the EC2 instance, you'll need to follow these steps:
- Connect to the EC2 instance using SSH: `ssh -L 8080:localhost:8080 <remote-host>`
- Install the Visual Studio Code server by running the following command: `curl -fsSL https://code-server.dev/install.sh | sh`
- Once the installation is complete, start the server by running the following command: 
    `code-server --auth none`