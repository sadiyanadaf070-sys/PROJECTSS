from flask import Flask

app = Flask(__name__)


@app.route("/")
def home():
    return "My application is running!"


@app.route("/api/hello")
def hello():
    return {
        "message": "Hello! This is my first API"
    }
    
@app.route("/open/info")
def info(): 
    return {
        "name": "Sadiya",
        "age":"21"
    }

if __name__ == "__main__":
    app.run(debug=True)