PORT=7000
TAG="${1:-latest}"

docker run -dp $PORT:$PORT --name fly-font fly-font:$TAG