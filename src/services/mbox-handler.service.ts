const simpleParser = require('mailparser').simpleParser;
const Mbox = require('node-mbox');
const emlFormat = require('eml-format');

import fs from 'fs';
import path from 'path';
import logging from '../config/logging';
import { EmlFile } from '../models/eml.model';
import { AddressName, Attachments, MboxModel } from '../models/mbox.model';
import * as _ from 'underscore';

const NAMESPACE = 'Mbox File Handler Service';

async function handleMboxFiles(streamedFile: fs.ReadStream, filename: string) {
    let response = false;
    const folderPath = path.join(__dirname, '../../output', filename);
    // create folder if not exists
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        logging.info(NAMESPACE, `Folder created successfully on ${folderPath}.`);
    }

    // Create .eml file
    let fileName = '';
    const mbox = new Mbox(streamedFile, {});
    mbox.on('message', async (msg: any) => {
        try {
            const stringMsg: string = extractHTML(msg.toString()).replace(/(\r\n|\n|\r)/gm, '');
            let email: MboxModel = await simpleParser(msg);
            email.htmlDoctype = stringMsg;
            fileName = createEmlFileName(email.date, email.from.value[0].address);
            const content = writeEmlFile(email);
            createEmlFile(folderPath, fileName, content);

            logging.info(NAMESPACE, `File handled successfully on ${folderPath} with name ${fileName}.`);
        } catch (e) {
            logging.error(NAMESPACE, `File handled with some error.`);
        }
    });

    mbox.on('error', function (err: any) {
        logging.error(NAMESPACE, `File handled with error ${err}.`);
    });

    mbox.on('end', function () {
        logging.info(NAMESPACE, `File handling end.`);
    });
}

/** Extract HTML from mbox file */
function extractHTML(text: string): string {
    const doctypeIndex = text.indexOf('<!doctype html>');
    if (doctypeIndex === -1) {
        return '';
    }
    return text.slice(doctypeIndex);
}

/** Create eml file */
function createEmlFile(folderPath: string, fileName: string, content: string): void {
    try {
        const filePath = path.join(folderPath, `${fileName}`);
        // Create .eml file
        fs.writeFileSync(filePath, content);
        logging.info(NAMESPACE, `File created successfully on ${folderPath} with name ${fileName}.`);
    } catch (err) {
        logging.error(NAMESPACE, `Failed File creation on ${folderPath} with name ${fileName}.`);
    }
}

/** Create eml file name */
function createEmlFileName(dateString: string, from: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${from}-${year}-${month}-${day}_${hours}-${minutes}-${seconds}.eml`;
}

function writeEmlFile(email: MboxModel): string {
    let result: string = '';
    let emlFile: EmlFile = {
        from: '',
        to: [],
        cc: [],
        subject: '',
        text: '',
        html: '',
        attachments: []
    };
    for (const key of Object.keys(email)) {
        switch (key) {
            case 'from': {
                emlFile.from = _.pluck(email.from.value, 'address').join(', ');
                break;
            }
            case 'to': {
                const addresses = _.map(email.to.value, (value: AddressName) => {
                    return { email: value.address, name: value.name };
                });
                emlFile.to = addresses;
                break;
            }
            case 'subject': {
                emlFile.subject = email.subject;
                break;
            }
            case 'text': {
                emlFile.text = email.text;
                break;
            }
            case 'html': {
                emlFile.html = email.html;
                break;
            }
            case 'htmlDoctype': {
                emlFile.html.concat(email.htmlDoctype);
                break;
            }
            case 'attachments': {
                const attachments = _.map(email.attachments, (value: Attachments) => {
                    return { name: value.filename, contentType: value.contentType, data: value.content };
                });
                emlFile.attachments = attachments;
                break;
            }
        }
    }

    emlFormat.build(emlFile, (err: any, eml: any) => {
        if (err) {
            return logging.error(NAMESPACE, `Failed eml File creation by build error ${err}.`);
        }
        result = eml;
        logging.info(NAMESPACE, `Eml File created successfully.`);
    });

    return result;
}

export default { handleMboxFiles };
