export interface MboxModel {
    attachments: Attachments[];
    header: any;
    headerLines: KeyLine[];
    html: string;
    text: string;
    textAsHtml: string;
    subject: string;
    references: string[];
    date: string;
    to: ValueHtmlText;
    from: ValueHtmlText;
    messageId: string;
    htmlDoctype: string;
}

export interface KeyLine {
    key: string;
    line: string;
}
export interface AddressName {
    address: string;
    name: string;
}
export interface ValueHtmlText {
    value: AddressName[];
    html: string;
    text: string;
}

export interface Attachments {
    type: string;
    content: Content;
    contentType: string;
    partId: string;
    release: string;
    contentDescription: string;
    filename: string;
    contentId: string;
    cid: string;
    related: boolean;
    headers: any;
    checksum: string;
    size: number;
}

export interface Content {
    type: string;
    data: number[];
}
