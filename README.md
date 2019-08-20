# signalk-to-nmea0183
Signal K Node server plugin to convert Signal K to NMEA 0183. See the code for a list of supported sentences.

To use the plugin you need to ctivate the plugin and the relevant sentences in server's Admin interface. This will make the conversion results available over the server's Tcp server on port 10110.

If you want to output the conversion result into a serial connection you need to configure the serial connection in the server's Admin interface and add an extra line to the `settings.json`, specifying that the serial connection should output the plugin's output:


```
{
  "pipedProviders": [
    {
      "pipeElements": [
        {
          "type": "providers/simple",
          "options": {
            "logging": false,
            "type": "NMEA0183",
            "subOptions": {
              "validateChecksum": true,
              "type": "serial",
              "suppress0183event": true,
              "sentenceEvent": "nmea1data",
              "providerId": "a",
              "device": "/dev/ttyExample",
              "baudrate": 4800,
              "toStdout": "nmea0183out"          <------------ ADD THIS LINE
            },
            "providerId": "a"
          }
        }
      ],
      "id": "example",
      "enabled": true
    }
  ],
  "interfaces": {}
}
```

Internally the plugin emits events named `nmea0183out`. This configuration sends the data of these events to the serialport's output. 

Be aware the data is sent by default to TCP port 10110 in which case it is possible to have access to the generated NMEA strings without configuring a serial output device by connecting to port 10110 with a TCP client (e.g. OpenCPN, Netcat, kplex etc)

![image](https://user-images.githubusercontent.com/1049678/63366888-64283700-c383-11e9-9a5f-7f9975e007f3.png)

