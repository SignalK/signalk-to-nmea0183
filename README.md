# signalk-to-nmea0183
Signal K Node server plugin to convert Signal K to NMEA 0183. See the code for a list of supported sentences.

To use the plugin you need to 
1. activate the plugin and the relevant sentences under /plugins/configure (see image below)
2. add a configuration `toStdout` to the `serialport` you want the sentences to go to

```
...
  }, {
    "id": "nmea-out",
    "pipeElements": [{
      "type": "providers/serialport",
      "options": {
        "device": "/dev/nmea-digyacht",
        "baudrate": 4800,
        "toStdout": "nmea0183out"
      }
    }, {
...
```

Internally the plugin emits events named `nmea0183out`. This configuration sends the data of these events to the serialport's output.



![image](https://user-images.githubusercontent.com/1049678/27145294-e21dd896-513d-11e7-9ebc-1e1d4b6cf0db.png)

