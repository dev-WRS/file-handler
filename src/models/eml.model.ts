export interface EmlFile {
    from: string;
    to: EmlTo[];
    cc: EmlTo[];
    subject: string;
    text: string;
    html: string;
    attachments: EmlAttachment[];
}

export interface EmlTo {
    name: string;
    email: string;
}

export interface EmlAttachment {
    name: string;
    contentType: string;
    data: any;
}
