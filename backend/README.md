# Backend

## Procedure

```txt
SendPeer            SignalServer            RecvPeer
 *                   |                       *            Websocket conneccted
 |      assign       |        assign         |
 |<------------------+---------------------->|            Assign peer ID for each peer
 |                   |                       |
 |      request      |        request        |< -+
 |<------------------+<----------------------+   |        RecvPeer send request for file info
 |                   |                       |
 |     response      |        response       |   |
 +------------------>+---------------------->|            SendPeer send response
 |                   |                       |   |
 |      offer        |         offer         |
 |<------------------+<----------------------+   |        RecvPeer send WebRTC offer
 |                   |                       |
 |      answer       |         answer        |   |
 +------------------>+---------------------->|            SendPeer send WebRTC answer
 |                   |                       |   |
 |     candidate     |       candidate       |
 |<=================>|<=====================>|   |        Peers negotiating ICE candidates
 |                   |                       |
 |       retry       |         retry         |   |
 +- - - - - - - - - >+- - - - - - - - - - - >+- -+        SendPeer may fail to select candidate, tell RecvPeer retry
 |                   |                       |
 |     progress      |       progress        |
 |<==================+<======================+            RecvPeer send progress
 |                   |                       |
 x                   |                       x            Websocket disconnected when done
```

## Events

```txt
+-----------------+-----------+-----------+-------------+
|       Name      |    From   |     To    |  Pack Types |
+=================+===========+===========+=============+
| assign          | Signal    | Recv/Send | string      |
+-----------------+-----------+-----------+-------------+
| request         | Recv      | Send      | string      |
+-----------------+-----------+-----------+-------------+
| response        | Send      | Recv      | string, any |
+-----------------+-----------+-----------+-------------+
| offer           | Recv      | Send      | string, any |
+-----------------+-----------+-----------+-------------+
| answer          | Send      | Recv      | string, any |
+-----------------+-----------+-----------+-------------+
| candidate       | Recv/Send | Recv/Send | string, any |
+-----------------+-----------+-----------+-------------+
| retry           | Send      | Recv      | string      |
+-----------------+-----------+-----------+-------------+
| progress        | Recv      | Send      | string, any |
+-----------------+-----------+-----------+-------------+
| invalid peer id | Signal    | Recv/Send | (None)      |
+-----------------+-----------+-----------+-------------+
| peer not exists | Signal    | Recv/Send | (None)      |
+-----------------+-----------+-----------+-------------+
```
