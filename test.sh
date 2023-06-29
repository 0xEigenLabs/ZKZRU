#!/bin/bash
set -ex

NETWORK=${1-dev}

npm run deploy:$NETWORK
export TOKEN=$(cat .contract.json | jq -r .testToken)
npx hardhat create-account --alias Alice --index 0 --network $NETWORK
npx hardhat setup-rollup --network $NETWORK
npx hardhat register-token --token $TOKEN --network $NETWORK
npx hardhat update-assets --network $NETWORK
ASSET_ID=$(cat .asset.json | jq -r .assetId)

# npx hardhat get-balance --alias Alice --index 0 --asset-id ${ASSET_ID} --network $NETWORK
# npx hardhat deposit --alias Alice --index 0 --value 10 --asset-id ${ASSET_ID} --network $NETWORK
# npx hardhat deposit --alias Alice --index 0 --value 10 --asset-id ${ASSET_ID} --network $NETWORK
# npx hardhat get-transactions --alias Alice --index 0 --network $NETWORK
# npx hardhat get-balance --alias Alice --index 0 --asset-id ${ASSET_ID} --network $NETWORK
# npx hardhat deposit --alias Alice --index 0 --value 10 --asset-id ${ASSET_ID} --network $NETWORK
# npx hardhat get-balance --alias Alice --index 0 --asset-id ${ASSET_ID} --network $NETWORK

npx hardhat create-account --alias Bob --index 1 --network $NETWORK
npx hardhat create-account --alias Charlie --index 3 --network $NETWORK
npx hardhat send-l1 --alias Alice --asset-id 1 --receiver 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --value 100 --network $NETWORK
npx hardhat send-l1 --alias Alice --asset-id 1 --receiver 0x90F79bf6EB2c4f870365E785982E1f101E93b906 --value 100 --network $NETWORK

# npx hardhat deposit --alias Bob --index 1 --value 10 --asset-id ${ASSET_ID} --network $NETWORK
# npx hardhat deposit --alias Bob --index 1 --value 10 --asset-id ${ASSET_ID} --network $NETWORK
# npx hardhat get-balance --alias Bob --index 1 --asset-id ${ASSET_ID} --network $NETWORK

npx hardhat depositall --asset-id ${ASSET_ID} --value 50 --network $NETWORK
npx hardhat sendall --asset-id ${ASSET_ID} --value 10 --network $NETWORK
npx hardhat get-balance --alias Alice --index 0 --asset-id ${ASSET_ID} --network $NETWORK
npx hardhat get-balance --alias Bob --index 1 --asset-id ${ASSET_ID} --network $NETWORK
npx hardhat get-balance --alias Charlie --index 3 --asset-id ${ASSET_ID} --network $NETWORK
# npx hardhat migrate-account --alias Alice --index 0 --network $NETWORK

# npx hardhat get-balance --alias Alice --index 0 --asset-id ${ASSET_ID} --network $NETWORK
# npx hardhat get-balance --alias Bob --index 1 --asset-id ${ASSET_ID} --network $NETWORK

# npx hardhat deposit --alias Alice --index 0 --value 11 --asset-id ${ASSET_ID} --network $NETWORK

# npx hardhat update-account --alias Alice --index 0 --network $NETWORK
# npx hardhat deposit --alias Alice --index 0 --value 12 --asset-id ${ASSET_ID} --network $NETWORK

# # TODO: test send
# npx hardhat withdraw --alias Alice --index 0 --value 12 --asset-id ${ASSET_ID} --network $NETWORK
# npx hardhat get-transactions --alias Alice --index 0 --network $NETWORK
