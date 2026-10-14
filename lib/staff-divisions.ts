export const divisions=['Cashier','Barista','Server staff','Kitchen staff','Steward','Office Boys','Others'];
export function division(role:string=''){
   const words=role.toLowerCase().trim().split(/[^a-z]+/);
   if(words.some(w=>['cashier','kasir'].includes(w)))return 'Cashier';
   if(words.includes('barista'))return 'Barista';
   if(words.some(w=>['server','waiter','waitress','waitstaff','pelayan'].includes(w)))return 'Server staff';
   if(words.some(w=>['steward','stewards','dishwasher'].includes(w)))return 'Steward';
   if((words.includes('office')&&words.some(w=>['boy','boys'].includes(w)))||words.includes('ob'))return 'Office Boys';
   if(words.some(w=>['kitchen','chef','cheff','cook','cooking','koki','dapur'].includes(w)))return 'Kitchen staff';
   return 'Others';
 }
