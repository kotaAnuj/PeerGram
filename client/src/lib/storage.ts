// IndexedDB storage for offline functionality
type StorageItem = {
  id: string;
  type: string;
  data: any;
  hash: string;
  timestamp: number;
  userId: number;
  synced: boolean;
};

class IndexedDBStorage {
  private dbName = 'peergramDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private connected = false;
  
  // Initialize the database
  public async connect(): Promise<boolean> {
    if (this.connected) return true;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject(false);
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.connected = true;
        resolve(true);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('items')) {
          const store = db.createObjectStore('items', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('hash', 'hash', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }
  
  // Save item to storage
  public async saveItem(item: Omit<StorageItem, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    await this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      
      // Generate unique ID
      const id = `${item.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create full item
      const fullItem: StorageItem = {
        ...item,
        id,
        timestamp: Date.now(),
        synced: false
      };
      
      const request = store.add(fullItem);
      
      request.onsuccess = () => resolve(id);
      request.onerror = (event) => reject(event);
    });
  }
  
  // Get item by ID
  public async getItem(id: string): Promise<StorageItem | null> {
    await this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      const request = store.get(id);
      
      request.onsuccess = () => {
        const item = request.result as StorageItem;
        resolve(item || null);
      };
      
      request.onerror = (event) => reject(event);
    });
  }
  
  // Get items by type
  public async getItemsByType(type: string, userId?: number): Promise<StorageItem[]> {
    await this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      const typeIndex = store.index('type');
      const request = typeIndex.getAll(type);
      
      request.onsuccess = () => {
        let items = request.result as StorageItem[];
        
        // Filter by userId if provided
        if (userId !== undefined) {
          items = items.filter(item => item.userId === userId);
        }
        
        // Sort by timestamp (newest first)
        items.sort((a, b) => b.timestamp - a.timestamp);
        
        resolve(items);
      };
      
      request.onerror = (event) => reject(event);
    });
  }
  
  // Update an item
  public async updateItem(id: string, data: Partial<StorageItem>): Promise<boolean> {
    await this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      
      // First get the item
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result as StorageItem;
        if (!item) {
          resolve(false);
          return;
        }
        
        // Update the item with new data
        const updatedItem = { ...item, ...data };
        const putRequest = store.put(updatedItem);
        
        putRequest.onsuccess = () => resolve(true);
        putRequest.onerror = (event) => reject(event);
      };
      
      getRequest.onerror = (event) => reject(event);
    });
  }
  
  // Delete an item
  public async deleteItem(id: string): Promise<boolean> {
    await this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event);
    });
  }
  
  // Get unsynced items
  public async getUnsyncedItems(): Promise<StorageItem[]> {
    await this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      const syncedIndex = store.index('synced');
      const request = syncedIndex.getAll(false);
      
      request.onsuccess = () => {
        const items = request.result as StorageItem[];
        resolve(items);
      };
      
      request.onerror = (event) => reject(event);
    });
  }
  
  // Mark item as synced
  public async markAsSynced(id: string): Promise<boolean> {
    return this.updateItem(id, { synced: true });
  }
  
  // Check if connection is established, connect if needed
  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }
  
  // Close the database connection
  public close(): void {
    if (this.db) {
      this.db.close();
      this.connected = false;
    }
  }
}

// Create and export singleton instance
export const localDB = new IndexedDBStorage();

// Data types helpers
export const DataTypes = {
  USER: 'user',
  POST: 'post',
  COMMENT: 'comment',
  LIKE: 'like',
  MESSAGE: 'message',
  CONNECTION: 'connection',
  NETWORK_STATS: 'network_stats'
};

// Helper for generating content hash
export function generateHash(content: any): string {
  // Simple hash function for demo purposes
  // In production, use a proper hash function
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// Parse URL from message content for link embedding
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}
