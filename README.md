# signalk-to-nmea0183
Signal K Node server plugin to convert Signal K to NMEA 0183. See the code for a list of supported sentences.

To use the plugin you need to activate the plugin and the relevant sentences in server's Admin interface. This will make the conversion results (NMEA 0183) available on Signalk's built-in TCP NMEA 0183 server (Port 10110). Signalk's built-in TCP NMEA 0183 server needs to be enabled within Signalk's Server->Settings->Interfaces->nmea-tcp .

As the plugin automatically sends NMEA 0183 data to Signalk's built-in TCP NMEA 0183 server, it is possible to have access to the NMEA 0183 strings without configuring anything (Aka a serial output device) by connecting to port 10110 with a TCP client (e.g. OpenCPN, Netcat, kplex etc)

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

Note: Internally the plugin emits the NMEA 0183 events to the named stream `nmea0183out`. The above configuration sends the converted data (NMEA 0183) in the `nmea0183out` stream to the serialport's output. 

![image](https://user-images.githubusercontent.com/1049678/63366888-64283700-c383-11e9-9a5f-7f9975e007f3.png)

