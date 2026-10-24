/** Synchronous animation frames; UI snapshots are intentionally less frequent. */
export function createFrameChannel(){
 const listeners=new Set();
 return {publish(control,timestamp){for(const listener of listeners)listener(control,timestamp)},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)}};
}
