import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { IStompSocket } from '@stomp/stompjs/esm6';
import * as SockJS from 'sockjs-client';
import { Mensaje } from './models/mensaje';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

// Esta es la forma usando las librerias más actualizadas, usando las anteriores cambia la forma de implementar

export class ChatComponent implements OnInit {

  client: Client | undefined;
  conectado: boolean = false;
  mensaje: Mensaje = new Mensaje();
  mensajes: Mensaje[] = [];
  escribiendo: string = '';

  constructor(){}
  
  ngOnInit(): void {
    this.client = new Client();

    this.client.webSocketFactory = ()=>{
      return new SockJS("http://localhost:8080/chat-websocket") as IStompSocket;
    }
 
    this.client.onConnect= (frame) => {
      console.log('Conectados: ' + this.client?.connected + ' : ' + frame);
      this.conectado = true;

      // Esto es para que se suscriba al evento de cuando se envia un mensaje
      this.client?.subscribe('/chat/mensaje', e => {
        let mensaje: Mensaje = JSON.parse(e.body) as Mensaje;
        mensaje.fecha = new Date(mensaje.fecha);

        if (!this.mensaje.color && mensaje.tipo == 'NUEVO_USUARIO' && this.mensaje.username == mensaje.username) {
          this.mensaje.color = mensaje.color;
        }

        this.mensajes.push(mensaje);
        console.log(mensaje);
      });


      // Esto es para que se suscriba al evento de cuando alguien esta escribiendo
      this.client?.subscribe('/chat/escribiendo', e => {
        this.escribiendo = e.body;
        setTimeout(() => this.escribiendo = '', 3000);
      });


      this.mensaje.tipo = 'NUEVO_USUARIO';
      this.client?.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)});

    }
 
    this.client.onDisconnect= (frame) => {
      console.log('Desconectados: ' + !this.client?.connected + ' : ' + frame);
      this.conectado = false;
    }

  }


  conectar () : void {
    this.client?.activate();
  }

  desconectar () : void {
    this.client?.deactivate();
  }

  enviarMensaje () : void {
    this.mensaje.tipo = 'MENSAJE';
    this.client?.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)});
    this.mensaje.texto = '';
  }


  escribiendoMensaje() {
    this.client?.publish({destination: '/app/escribiendo', body: this.mensaje.username});
  }

}
