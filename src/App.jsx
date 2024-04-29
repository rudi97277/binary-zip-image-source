import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import JSZip from "jszip";

function App() {
  const [message, setMessage] = useState('');
  const [image,setImage] = useState(null);
  const dbName = 'MyDatabase';
    const dbVersion = 1;
    const objectStoreName = 'Images';


  const fetchZipFile = async () => {
    try {
      const response = await fetch('http://127.0.0.1:1211/api/testing');
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error fetching ZIP file:', error);
      setMessage('Error fetching ZIP file');
      return null;
    }
  };

  const saveImageToIndexedDB = async () => {
    const zipFile = await fetchZipFile();
    if (!zipFile) return;

    try {
      const zip = await JSZip.loadAsync(zipFile);
      let firstImageUrl = null;

      zip.forEach(async (relativePath, file) => {
        if (file.dir) return; // Skip directories
        if (isImageFile(relativePath)) {
          const blob = await file.async('blob');
          const imageUrl = URL.createObjectURL(blob);
          if (!firstImageUrl) {
            firstImageUrl = imageUrl;
            saveToIndexedDB(blob); // Save the blob to IndexedDB
          }
        }
      });

      if (firstImageUrl) {
        setMessage('First image saved to IndexedDB');
      } else {
        setMessage('No image found in the ZIP file');
      }
    } catch (error) {
      console.error('Error extracting ZIP contents:', error);
      setMessage('Error extracting ZIP contents');
    }
  };

  const saveToIndexedDB = (blob) => {
    
    const request = window.indexedDB.open(dbName, dbVersion);

    request.onerror = function(event) {
      console.log("Error opening database");
    };
    
    request.onupgradeneeded = function(event) {
      var db = event.target.result;
      
      // Create or access an object store
      var objectStore = db.createObjectStore(objectStoreName, { keyPath: 'id' });
    };
    
    request.onsuccess = function(event) {
      var db = event.target.result;
    
      // Insert data into the object store
      var transaction = db.transaction([objectStoreName], 'readwrite');
      var objectStore = transaction.objectStore(objectStoreName);
    
      var request = objectStore.put({'id': 'yeah', blob} );
    
      request.onsuccess = function(event) {
        console.log('Data inserted successfully');
      };
    
      request.onerror = function(event) {
        console.log('Error inserting data');
      };
    };
  };

  const isImageFile = (fileName) => {
    // Add logic to determine if a file is an image
    return /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  };

  const getImage =() => {
    const request = window.indexedDB.open(dbName, dbVersion);

    request.onerror = function(event) {
      console.log("Error opening database");
    };

    request.onsuccess = (event) => {
      var db = event.target.result;

      // Start a new transaction
      var transaction = db.transaction([objectStoreName], 'readonly');
      var objectStore = transaction.objectStore(objectStoreName);

      // Use the get() method to retrieve data by key
      var getRequest = objectStore.get('yeah'); // Replace 'your_specific_key' with the key you want to retrieve

      getRequest.onsuccess = (event) => {
        // Check if data is found
        if (getRequest.result) {
          console.log('Data found:', getRequest.result);
          setImage(URL.createObjectURL(getRequest.result.blob))
          // Do something with the retrieved data, e.g., set it to state
          // this.setState({ data: getRequest.result });
        } else {
          console.log('No data found with the specified key');
        }
      };

      getRequest.onerror = function(event) {
        console.log('Error retrieving data');
      };
    };
  }

  return (
    <div>
      <button onClick={saveImageToIndexedDB}>Save First Image to IndexedDB</button>
      <button onClick={getImage}>GET</button>
      <p>{message}</p>
      {image && <img src={image}/>}
    </div>
  );
}

export default App;
