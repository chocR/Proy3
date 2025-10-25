<<<<<<< HEAD
=======

>>>>>>> 018b6a6 (Versión inicial)
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="")

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

if __name__ == "__main__":
<<<<<<< HEAD
    app.run(host="127.0.0.1", port=5000, debug=True)

=======
    # Run on localhost:5000
    app.run(host="127.0.0.1", port=5000, debug=True)
>>>>>>> 018b6a6 (Versión inicial)
