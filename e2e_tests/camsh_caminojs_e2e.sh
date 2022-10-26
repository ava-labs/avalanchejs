#!/bin/bash

is_bootstrapped () {
    [ $# != 2 ] && echo is_bootstrapped requires two arguments: node_ip node_port && exit 1
    node_ip=$1
    node_port=$2
    curl -s -X POST --data '{ "jsonrpc":"2.0", "id"     :1, "method" :"health.getLiveness" }' -H 'content-type:application/json;' $node_ip:$node_port/ext/health | grep true > /dev/null
}

caminogo_ip=127.0.0.1
caminogo_ports=$(seq 9650 2 9658)

max_bootstrapping_time=130

[ $# != 2 ] && echo usage: $0 camsh_dir caminojs_dir && exit 1

camsh_location=$1
caminojs_location=$2

# make absolute paths
camsh_location=$(cd $camsh_location; pwd)
caminojs_location=$(cd $caminojs_location; pwd)

# create camsh ipc fifo
fifo_fname=$camsh_location/camsh.fifo
rm -f $fifo_fname
mkfifo $fifo_fname
sleep 6000 > $fifo_fname &

# start camsh network
cd $camsh_location
./camsh < $fifo_fname &
echo runscript scripts/five_node_staking.lua >> $fifo_fname

# wait network bootstrapping
start_time=$(date -u +%s)
elapsed=0
sleep 2
for port in $caminogo_ports
do
    echo waiting for node $caminogo_ip:$port to finish bootstrapping
    is_bootstrapped $caminogo_ip $port
    while [ $? != 0 ] && [ $elapsed -lt $max_bootstrapping_time ]
    do
        sleep 5
        end_time=$(date -u +%s)
        elapsed=$(($end_time-$start_time))
        is_bootstrapped $caminogo_ip $port
    done
done
echo elapsed: $elapsed seconds
if [ $elapsed -gt $max_bootstrapping_time ]
then
    echo WARN: elapsed time is greater than max_bootstrapping_time $max_bootstrapping_time
fi

# execute tests
export CAMINOGO_IP=$caminogo_ip
export CAMINOGO_PORT=$(echo $caminogo_ports | cut -d" " -f1)
echo testing on caminogo $CAMINOGO_IP:$CAMINOGO_PORT
cd $caminojs_location
yarn test -i --roots e2e_tests

# end camsh network
cd $camsh_location
echo exit >> $fifo_fname
echo killall caminogo

# cleanup
rm -f $fifo_fname
