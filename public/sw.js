self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{}}catch{}
 event.waitUntil(self.registration.showNotification(data.title||'Café Team',{body:data.body||'Open Café Team for an update.',icon:'/app-icon-192.png',badge:'/app-icon-192.png',data:{url:'/overtime'},tag:'cafe-overtime'}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil(clients.openWindow('/overtime'));
});
