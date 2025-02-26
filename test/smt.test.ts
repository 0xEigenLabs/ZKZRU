import { expect } from "chai";
import path = require("path");
import * as test from "./test";
import * as utils from "@eigen-secret/core/dist-node/utils";
import { siblingsPad, StateTree } from "@eigen-secret/core/dist-node/state_tree";
const { ethers } = require("hardhat");
import { SMTModel } from "../server/dist/state_tree";
import { deployPoseidons } from "@eigen-secret/core/dist-node/deploy_poseidons.util";
/* globals describe, before, it */
describe("Test SMT Membership Query", function() {
    // runs circom compilation
    let circuit: any;
    let tree: any;
    let Fr: any;
    before(async function() {
        let stateTree = path.join(__dirname, "../circuits", "state_tree.circom");
        circuit = await test.genTempMain(stateTree, "Membership", "", [20], {});
        await circuit.loadSymbols();
        tree = new StateTree();
        await tree.init(SMTModel);
        Fr = tree.F;
    });

    it("Test Membership", async function() {
        const key = Fr.e(333);
        const value = Fr.e(444);
        await tree.insert(key, value);
        console.log("root: ", tree.tree.root)
        let ci = await tree.find(key, value);

        let input = {
            key: Fr.toObject(key),
            value: Fr.toObject(value),
            root: Fr.toObject(tree.root()),
            siblings: siblingsPad(ci.siblings, Fr),
            enabled: 1
        };
        await utils.executeCircuit(circuit, input)
    });
});

describe("Test SMT Membership Update", function() {
    // runs circom compilation
    let circuit: any;
    let tree: any;
    before(async function() {
        let stateTree = path.join(__dirname, "../circuits", "state_tree.circom");
        circuit = await test.genTempMain(stateTree, "NonMembershipUpdate", "", [20], {});
        await circuit.loadSymbols();
        tree = new StateTree();
        await tree.init(SMTModel);
    });

    it("Test NonMembershipUpdate", async function() {
        const key = 333333n;
        const value = 444111n;
        let ci = await tree.insert(key, value);
        let input = ci.toNonMembershipUpdateInput(tree);
        await utils.executeCircuit(circuit, input)
    });

    it("Test Double NonMembershipUpdate", async function() {
        const key = 17195092312975762537892237130737365903429674363577646686847513978084990105579n;
        const value = 19650379996168153643111744440707177573540245771926102415571667548153444658179n;
        let ci = await tree.insert(key, value);
        let input = ci.toNonMembershipUpdateInput(tree);

        const key2 = 1n;
        const value2 = 2n;
        let ci2 = await tree.insert(key2, value2);
        let input2 = ci2.toNonMembershipUpdateInput(tree);
        await utils.executeCircuit(circuit, input)
        await utils.executeCircuit(circuit, input2)
    });
});

describe("Test SMT smart contract", () => {
    let contract: any;
    let circuit: any;
    let tree: any;
    let Fr: any;

    before(async () => {
        let stateTree = path.join(__dirname, "../circuits", "state_tree.circom");
        circuit = await test.genTempMain(stateTree, "Membership", "", [20], {});
        await circuit.loadSymbols();

        const [signer, deploy] = await ethers.getSigners();
        console.log("signer", signer.address);

        let poseidons = await deployPoseidons(ethers, signer, [2, 3]);
        let F = await ethers.getContractFactory("SMTMock");
        let smtMock = await F.deploy();
        await smtMock.deployed();

        let factoryMP = await ethers.getContractFactory("ModuleProxy");
        const initData = F.interface.encodeFunctionData(
            "initializeSMT",
            [poseidons[0].address, poseidons[1].address]
          );
        let moduleProxy = await factoryMP.deploy(smtMock.address, deploy.address, initData);
        await moduleProxy.deployed();
        console.log("moduleProxy address:", moduleProxy.address);

        contract = new ethers.Contract(
            moduleProxy.address,
            smtMock.interface,
            signer)

        tree = new StateTree();
        await tree.init(SMTModel);
        Fr = tree.F;
    })

    it("Test contract and circuits", async () => {
        const oldKey = "0";
        const oldValue = "0";

        // test 1
        let key: any;
        let value: any;
        for (let i = 0; i < 128; i ++) {
            key = Fr.random();
            value = Fr.random();
            await tree.insert(key, value);
            let ci = await tree.find(key, value);
            let siblingsContract = ci.siblings.slice();
            // Note:do not push "0" into siblingsContract
            // otherwise the root calculation in contract.smtVerifier will be affected.
            for (let i=0; i<ci.siblings.length; i++) {
                siblingsContract[i] = tree.F.toObject(ci.siblings[i]);
            }

            let input = {
                key: Fr.toObject(key),
                value: Fr.toObject(ci.foundValue),
                root: Fr.toObject(tree.root()),
                // Note: need to pad siblings with "0"
                // Cause the siblings array length in circuit is N_LEVEL
                siblings: siblingsPad(ci.siblings, Fr),
                enabled: 1
            };
            await utils.executeCircuit(circuit, input)

            const result = await contract.smtVerifier(
                siblingsContract, Fr.toObject(key),
                Fr.toObject(value), oldKey, oldValue, false, false, 20)
            expect(BigInt(result)).to.eq(Fr.toObject(tree.tree.root));
        }

        // test 2
        const key1 = Fr.e(19419982613806763325769100912950148077972106661286633749715627930322516296981n);
        const value1 = Fr.e(5203787646884389997721541990301039755402773073070944864463089753046777216823n);
        await tree.insert(key1, value1);
        let ci1 = await tree.find(key1, value1);

        let siblingsContract1 = ci1.siblings.slice();
        // Note: do not push "0" into siblingsContract1
        // otherwise the root calculation in contract.smtVerifier will be affected.
        for (let i=0; i<ci1.siblings.length; i++) {
            siblingsContract1[i] = tree.F.toObject(siblingsContract1[i]).toString();
        }

        let input1 = {
            key: Fr.toObject(key1),
            value: Fr.toObject(ci1.foundValue),
            root: Fr.toObject(tree.root()),
            // Note: need to pad siblings with "0"
            // Cause the siblings array length in circuit is N_LEVEL
            siblings: siblingsPad(ci1.siblings, Fr),
            enabled: 1
        };
        await utils.executeCircuit(circuit, input1)

        const result1 = await contract.smtVerifier(
            siblingsContract1, Fr.toObject(key1).toString(),
            Fr.toObject(value1).toString(), oldKey, oldValue, false, false, 20)
        expect(BigInt(result1)).to.eq(Fr.toObject(tree.tree.root));

        // test 3, pass wrong value, should not equal
        const wrongValue = Fr.e(4444+1);
        const result2 = await contract.smtVerifier(
            siblingsContract1, Fr.toObject(key1).toString(),
            Fr.toObject(wrongValue).toString(), oldKey, oldValue, false, false, 20)
        expect(BigInt(result2) == Fr.toObject(tree.tree.root)).to.eq(false);
    })
})
