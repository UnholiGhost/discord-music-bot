while true
do
  node .
  echo "Node.js app crashed with exit code $?. Restarting..." >&2
  sleep 1
done