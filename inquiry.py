import bluetooth
import time

def find_device(name):
    """Scan for the device with the given name."""
    devices = bluetooth.discover_devices(duration=8, lookup_names=True)
    target_device = None
    for addr, device_name in devices:
        print(device_name)
        if device_name == name:
            target_device = addr
            break
    return target_device

def read_device_data(sock):
    """Read data from the device."""
    # This is a placeholder for reading data. You may need to modify it based on how the data is structured.
    data = sock.recv(1024)
    return data

def main():
    device_name = "ANR Corp M40"  # Adjust the name based on how it appears in Bluetooth discovery
    device_address = find_device(device_name)
    
    if device_address is None:
        print("Could not find the device.")
        return
    
    # Create a Bluetooth socket and connect to the device
    sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
    try:
        sock.connect((device_address, 1))  # The second argument is the port, it might need adjustment
        print("Connected to the device successfully.")
        
        try:
            while True:
                data = read_device_data(sock)
                print("Received data:", data)
                time.sleep(1)  # Wait for 1 second before reading next data
        except KeyboardInterrupt:
            print("Disconnected.")

    except bluetooth.btcommon.BluetoothError as err:
        print("An error occurred while connecting or using the Bluetooth device:", err)
    finally:
        sock.close()

if __name__ == "__main__":
    main()
