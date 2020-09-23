const fdk=require('@fnproject/fdk');
const impl=require('./funcImpl');

fdk.handle(impl.handler)
