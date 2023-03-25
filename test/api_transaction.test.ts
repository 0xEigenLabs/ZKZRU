const request = require('supertest');
const express = require('express');
const consola = require("consola");
import app from "../server/service";
import { SigningKey } from "../src/account";
import sequelize from "../src/db";
import { ethers } from "ethers";
import {signEOASignature} from "../src/utils";
import { expect, assert } from "chai";
import { StateTree } from "../src/state_tree";
import { NoteState } from "../server/note";

describe('POST /transactions', function() {
    this.timeout(1000 * 1000);
    const alias = "eigen.eth";
    before(async() => {
        let newEOAAccount = await ethers.Wallet.createRandom();
        let rawMessage = "Use Eigen Secret to shield your asset";
        let timestamp = Math.floor(Date.now()/1000).toString();
        const signature = await signEOASignature(newEOAAccount, rawMessage, newEOAAccount.address, alias, timestamp);

        let tmpKey = await (new SigningKey()).newKey(undefined);
        let pubKey = tmpKey.pubKey.pubKey;
        const response = await request(app)
        .post('/transactions')
        .send({
            alias: alias,
            timestamp: timestamp,
            message: rawMessage,
            hexSignature: signature,
            ethAddress: newEOAAccount.address,
            pubKey: pubKey,
            content: "0x12",
            content2: "0x123",
            noteIndex: StateTree.index.toString(),
            note2Index: StateTree.index.toString(),
            proof: "0x12",
            publicInput: "{\"root\": \"11\"}"
        })
        .set('Accept', 'application/json');

        consola.log(response.body)
        expect(response.status).to.eq(200);
        expect(response.body.errno).to.eq(0);
        expect(response.body.data["id"]).to.gt(0);
    });

    it('get tx', async() => {
        const response = await request(app)
        .get('/transactions/' + alias)
        .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).to.eq(200);
        expect(response.body.errno).to.eq(0);
        assert(response.body.data[0].alias, alias)
    });

    it("update smt", async() => {
        let newEOAAccount = await ethers.Wallet.createRandom();
        let rawMessage = "Use Eigen Secret to shield your asset";
        let timestamp = Math.floor(Date.now()/1000).toString();
        const signature = await signEOASignature(newEOAAccount, rawMessage, newEOAAccount.address, alias, timestamp);

        const response = await request(app)
        .post('/statetree')
        .send({
            alias: alias,
            timestamp: timestamp,
            message: rawMessage,
            hexSignature: signature,
            ethAddress: newEOAAccount.address,
            newStates: [
                "1233",
                "1",
                "111",
                "456",
                "111"
            ]
        })
        .set('Accept', 'application/json');
        console.log(response.body.data);
        expect(response.status).to.eq(200);
        expect(response.body.errno).to.eq(0);
        assert(response.body.data.proof.dataTreeRoot, "11789410253405726493196100626786015322476180488220624361762052237583743243512")
        let encryptedNotes = response.body.data.encryptedNotes;

        // update notes
        const response2 = await request(app)
        .post('/transactions/notes')
        .send({
            alias: alias,
            timestamp: timestamp,
            message: rawMessage,
            hexSignature: signature,
            ethAddress: newEOAAccount.address,
            notes: [
                {
                    index: encryptedNotes[0].index,
                    content: encryptedNotes[0].content,
                    state: NoteState.SPENT
                },
                {
                    index: encryptedNotes[1].index,
                    content: encryptedNotes[1].content,
                    state: NoteState.SPENT
                }
            ]
        })
        .set('Accept', 'application/json');
        console.log(response2.body.data);
        expect(response2.status).to.eq(200);
        expect(response2.body.errno).to.eq(0);

    })
});
