import zlib
import base64
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from ..config import settings
import aiofiles

MASTER_KEY = base64.b64decode(settings.master_key_base64)

def encrypt_data(data: bytes) -> bytes:
    """Compresses and then encrypts data using AES-GCM."""
    compressed_data = zlib.compress(data)
    
    nonce = get_random_bytes(12)
    cipher = AES.new(MASTER_KEY, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(compressed_data)
    
    return nonce + tag + ciphertext

def decrypt_data(encrypted_data: bytes) -> bytes:
    """Decrypts and then decompresses data."""
    nonce = encrypted_data[:12]
    tag = encrypted_data[12:28]
    ciphertext = encrypted_data[28:]
    
    cipher = AES.new(MASTER_KEY, AES.MODE_GCM, nonce=nonce)
    try:
        decrypted_data = cipher.decrypt_and_verify(ciphertext, tag)
        return zlib.decompress(decrypted_data)
    except (ValueError, KeyError):
        # Handle decryption/verification errors
        raise ValueError("Decryption failed. Data may be corrupt or tampered with.")

async def encrypt_file(input_path: str, output_path: str):
    """Reads a file, encrypts its content, and writes to a new file."""
    async with aiofiles.open(input_path, 'rb') as f:
        plaintext = await f.read()
    
    encrypted_content = encrypt_data(plaintext)
    
    async with aiofiles.open(output_path, 'wb') as f:
        await f.write(encrypted_content)

async def decrypt_file(input_path: str, output_path: str):
    """Reads an encrypted file, decrypts its content, and writes to a new file."""
    async with aiofiles.open(input_path, 'rb') as f:
        encrypted_content = await f.read()
    
    decrypted_content = decrypt_data(encrypted_content)
    
    async with aiofiles.open(output_path, 'wb') as f:
        await f.write(decrypted_content)
