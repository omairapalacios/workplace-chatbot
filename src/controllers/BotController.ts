import { Request, Response } from "express";
import { Controller, Post } from "@overnightjs/core";
import { sendMessage, sendVerificationCode, verifyCode } from "../utils/twilio";

import { runQuery } from "../utils/dialogflow";
import { verifyIdentity } from "../models/database/functions"

import { User } from "../models/interfaces/user"

const storage = require('node-persist');

let user : User = { 
  document:'',
  name: '',
  lastname: '',
  cellphone: '',
  email:'',
  status: 'inactivo'}
@Controller("api/bot")
export class BotController {
  
  @Post()
  private async postMessage(request: Request, response: Response) {
      /* Obtenemos el mensaje :Body,
      El numero desde el cual lo enviamos : To ,
      El número del cliente que lo recibira: From. */
    const { Body, To, From } = request.body;
    console.log(Body);
    
    let message = '';
    try {
      await storage.init({expiredInterval : 3 * 60 * 1000});
      const dialogflow = await runQuery(Body, From)
      // Enviamos mensaje a dialogflow y esperamos que coincida con algun intento
      console.log(dialogflow.intent.displayName);
      switch (dialogflow.intent.displayName) {

        case "usuarioIngresaIdentificación": {
          const { name, cellphone, status, document}  = await verifyIdentity(Body);
          user.name = name;
          user.cellphone = cellphone;
          user.status = status;
          user.document = document;
          await storage.setItem('user', user)
          await storage.setItem('from', From)
          await storage.setItem('to', To)
          /* console.log('CELLPHONE',cellphone);
          console.log('USER FULL',user); */
            if (cellphone) {    
              message = `por favor ingrese el código de verificación enviado al número de celular registrado`; 
              await sendMessage(From, To, message);
              await sendVerificationCode(cellphone);
            }
            else {
              message = `Lo sentimos, usted no se encuentra registrado`;
              await sendMessage(From, To, message);
            }
          break;
        }
        case "usuarioIngresaCodigo": {
          /* console.log('CELLPHONE', user.cellphone);
          console.log('BODY',Body); */
          
          const status = await verifyCode(user.cellphone, Body)
          if (status === 'approved') {
            message = `Bienvenido(a) *${user.name}* 😊\n¡Estoy aquí para ayudarte!`;
            await sendMessage(From, To, message);
            message = `Por favor indicame el _mes_ de la boleta que deseas consultar`;
            await sendMessage(From, To, message);
          }
          else {
            message = `Codigo de verificación incorrecto`;
            await sendMessage(From, To, message);
          }
          break;
        }
        default:
          if (dialogflow.fulfillmentText) {
            await sendMessage(From, To, dialogflow.fulfillmentText);
          } 
          /* user = await storage.getItem('user');
          if(user){
            if (dialogflow.fulfillmentText) {
              await sendMessage(From, To, dialogflow.fulfillmentText);
            } 
          }
          else {
            message = `No has iniciado sesión o tu sesión a finalizado. Por favor ingresa tu documento de identidad para poder ayudarte 😉`;
            await sendMessage(From, To, message);
          } */
      }
      return response.status(200)
    }
    catch(error){
      throw Error(error);
    }
  }
}


/* const MessagingResponse = require('twilio').twiml.MessagingResponse;


const response = new MessagingResponse();
const message = response.message();
message.body('Hello World!');
response.redirect('https://demo.twilio.com/welcome/sms/');

console.log(response.toString());
 */