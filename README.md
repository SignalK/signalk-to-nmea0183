# signalk-to-nmea0183
Signal K Node server plugin to convert Signal K to NMEA 0183 sentences.

## Usage
Once activated and configurated via the signalk admin panel, the plugin output events on tcp port 10110.

![image](https://user-images.githubusercontent.com/1049678/27145294-e21dd896-513d-11e7-9ebc-1e1d4b6cf0db.png)

You can see the outgoing NMEA sentences with the command `telnet localhost 10110` to validate your configurations.


## Aditional output
Internally the plugin emits events named `nmea0183out`. 
The data of those events can be send to a serial output by editing the signalk configuration file. 

In this example, The events of `nmea0183out` are send to `/dev/nmea-digyacht`
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
      },
      ...
  }, {
...
```
