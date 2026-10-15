self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(clients.claim()));
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{}}catch{}
 const url=data.url==='/staff'?'/staff':'/overtime';
 event.waitUntil(self.registration.showNotification(data.title||'Café Team',{body:data.body||'Open Café Team for an update.',icon:'/app-icon-192.png',badge:'/app-icon-192.png',data:{url},tag:typeof data.tag==='string'?data.tag:'cafe-overtime'}));
});
self.addEventListener('notificationclick',event=>{
 const url=event.notification.data?.url==='/staff'?'/staff':'/overtime';
 event.notification.close();event.waitUntil(clients.openWindow(url));
});
