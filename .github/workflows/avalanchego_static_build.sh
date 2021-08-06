
sed -i 's/ldflags \"/ldflags \"-extldflags \\\"-static\\\" -linkmode external /' scripts/*sh
sed -i 's/rm -rf tmp//' scripts/build_prev.sh
./scripts/build.sh
sed -i 's/.*git clone.*//' scripts/build_prev.sh
sed -i 's/ldflags \"/ldflags \"-extldflags \\\"-static\\\" -linkmode external /' tmp/scripts/build_avalanche.sh
sed -i 's/go build/go build -ldflags \"-extldflags \\\"-static\\\" -linkmode external \"/' tmp/scripts/build_coreth.sh
./scripts/build.sh

