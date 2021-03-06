// dialogflow.ts

const dialogflow = require("dialogflow");

const sessionClient = new dialogflow.SessionsClient({
  credentials:  JSON.parse(Buffer.from(`${process.env.SA_DIAL0GFLOW}`, 'base64').toString('ascii'))
});
const projectId: string = process.env.DIALOGFLOW_PROJECT_ID!;

export const runQuery = async (query: string, number: string) : Promise<any> => {
    try {
      // Identificador unico de sesión
      const sessionId = number;
      console.log('session ID',sessionId);
/*       console.log('session client',sessionClient); */
      
      // Crear una nueva sesión
      const sessionPath = sessionClient.sessionPath(projectId, sessionId);
/*       console.log('session PATH',sessionPath); */
      
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            // query para enviar a dialogflow
            text: query,
            languageCode: "es-ES"
          }
        }
      };
      // Enviar request
      
      const responses = await sessionClient.detectIntent(request);


      
      const result = responses[0].queryResult;
      return result;
    } catch (error) {
      throw Error(error);
    }
};
