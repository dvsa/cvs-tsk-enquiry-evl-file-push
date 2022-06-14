import Client = require('ssh2-sftp-client');


export const filePush = (filename: string) => {

  const config = {
    host: process.env.SFTP_Address,
    username: process.env.SFTP_User,
    password: process.env.SFTP_Password,
  };
  
  const sftp = new Client();

  const remoteFileLocation = '/path/to/save/' + filename;

  sftp.connect(config).then(() => {
    return sftp.fastPut(filename, remoteFileLocation);
  }).then(() => {
    return sftp.end();
  }).catch((err) => {
    throw err;
  });

};





