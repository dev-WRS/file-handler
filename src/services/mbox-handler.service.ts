const simpleParser = require('mailparser').simpleParser;
const Mbox = require('node-mbox');
const emlFormat = require('eml-format');
import * as _ from 'underscore';
import fs from 'fs';
import path from 'path';

import logging from '../config/logging';
import { EmlFile } from '../models/eml.model';
import { AddressName, Attachments, MboxModel } from '../models/mbox.model';

const NAMESPACE = 'Mbox File Handler Service';

async function handleMboxFiles(streamedFile: fs.ReadStream, filename: string) {
    const folderPath = path.join(__dirname, '../../output', filename);
    // create folder if not exists
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        logging.info(`Folder created successfully on ${folderPath}.`, { label: NAMESPACE });
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

            logging.info(`File handled successfully on ${folderPath} with name ${fileName}.`, { label: NAMESPACE, message: filename });
        } catch (e: any) {
            logging.error(`File handled with some error.`, { label: NAMESPACE, message: e.message });
        }
    });

    mbox.on('error', function (err: any) {
        logging.error(`File handled with error ${err}.`, { label: NAMESPACE, message: err.message });
    });

    mbox.on('end', function () {
        logging.info(`File handling end.`, { label: NAMESPACE });
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
        logging.info(`EML file created successfully on ${folderPath} with name ${fileName}.`, { label: NAMESPACE });
    } catch (err: any) {
        logging.error(`EML File creation failed on ${folderPath} with name ${fileName}.`, { label: NAMESPACE, message: err.message });
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
    if (email.to === undefined) {
        email.to = { value: [{ address: 'noMail@nomail.com', name: 'No Mail' }], html: '', text: '' };
    }
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
                emlFile.html = typeof email.html !== 'string' ? email.htmlDoctype : `${emlFile.html}\r\n${email.htmlDoctype}`;
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
            return logging.error(`Failed eml File creation by build error ${err}.`, { label: NAMESPACE, message: err.message });
        }
        result = eml;
        logging.info(`Eml File created successfully.`, { label: NAMESPACE });
    });

    return result;
}

export default { handleMboxFiles };
