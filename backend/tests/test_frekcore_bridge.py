"""Tests pour le bridge KORA → FrekCore

Tests minimaux :
1. emit_frek_presence appelé si duration >= 30
2. emit_frek_presence NON appelé si duration < 30

Mock des appels HTTP vers FrekCore.
"""

import pytest
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
import os

# Set environment variables before importing
os.environ['FREKCORE_API_URL'] = 'https://frekcore.test.com'
os.environ['FREKCORE_KORA_SECRET'] = 'test_secret_key'

from services.frekcore_bridge import emit_frek_presence, _mask_frek_id


class TestFrekCoreBridge:
    """Tests du bridge FREK-P"""
    
    @pytest.mark.asyncio
    async def test_emit_frek_presence_called_when_duration_gte_30(self):
        """
        Test 1: emit_frek_presence doit émettre vers FrekCore
        quand duration_seconds >= 30 (Scénario Marcus)
        """
        # Mock de la réponse HTTP
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value='{"success": true}')
        
        mock_session = AsyncMock()
        mock_session.post = MagicMock(return_value=AsyncMock(
            __aenter__=AsyncMock(return_value=mock_response),
            __aexit__=AsyncMock(return_value=None)
        ))
        
        with patch('aiohttp.ClientSession') as mock_client:
            mock_client.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_client.return_value.__aexit__ = AsyncMock(return_value=None)
            
            # Appel avec duration >= 30
            result = await emit_frek_presence(
                frek_id="FRK-TEST123456",
                track_id="track_abc123",
                source="archive",
                duration_seconds=30
            )
            
            # Vérification : doit retourner True (émission réussie)
            assert result == True
            
            # Vérification : HTTP POST doit avoir été appelé
            mock_session.post.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_emit_frek_presence_not_called_when_duration_lt_30(self):
        """
        Test 2: emit_frek_presence ne doit PAS émettre vers FrekCore
        quand duration_seconds < 30 (seuil Marcus non atteint)
        """
        with patch('aiohttp.ClientSession') as mock_client:
            # Appel avec duration < 30
            result = await emit_frek_presence(
                frek_id="FRK-TEST123456",
                track_id="track_abc123",
                source="archive",
                duration_seconds=29
            )
            
            # Vérification : doit retourner False (pas d'émission)
            assert result == False
            
            # Vérification : HTTP POST ne doit PAS avoir été appelé
            mock_client.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_emit_frek_presence_with_duration_exactly_30(self):
        """
        Test edge case: duration exactement 30 secondes
        Doit émettre (>= 30, pas > 30)
        """
        mock_response = AsyncMock()
        mock_response.status = 201
        mock_response.text = AsyncMock(return_value='{}')
        
        mock_session = AsyncMock()
        mock_session.post = MagicMock(return_value=AsyncMock(
            __aenter__=AsyncMock(return_value=mock_response),
            __aexit__=AsyncMock(return_value=None)
        ))
        
        with patch('aiohttp.ClientSession') as mock_client:
            mock_client.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_client.return_value.__aexit__ = AsyncMock(return_value=None)
            
            result = await emit_frek_presence(
                frek_id="FRK-TEST123456",
                track_id="track_exact30",
                source="jamendo",
                duration_seconds=30
            )
            
            assert result == True
    
    @pytest.mark.asyncio
    async def test_emit_frek_presence_without_duration(self):
        """
        Test: Si duration_seconds est None, doit émettre
        (cas legacy où la durée n'est pas fournie)
        """
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value='{}')
        
        mock_session = AsyncMock()
        mock_session.post = MagicMock(return_value=AsyncMock(
            __aenter__=AsyncMock(return_value=mock_response),
            __aexit__=AsyncMock(return_value=None)
        ))
        
        with patch('aiohttp.ClientSession') as mock_client:
            mock_client.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_client.return_value.__aexit__ = AsyncMock(return_value=None)
            
            result = await emit_frek_presence(
                frek_id="FRK-TEST123456",
                track_id="track_no_duration",
                source="creator"
                # duration_seconds non fourni
            )
            
            assert result == True
    
    def test_mask_frek_id(self):
        """Test du masquage FREK-ID pour les logs"""
        # FREK-ID normal
        assert _mask_frek_id("FRK-ABCD1234XYZ") == "FRK-...XYZ"
        
        # FREK-ID court
        assert _mask_frek_id("FRK") == "***"
        
        # FREK-ID vide
        assert _mask_frek_id("") == "***"
        assert _mask_frek_id(None) == "***"


class TestFrekCoreNetworkErrors:
    """Tests de la gestion d'erreur réseau"""
    
    @pytest.mark.asyncio
    async def test_emit_handles_network_error_silently(self):
        """
        Test: Les erreurs réseau ne doivent pas bloquer le player
        """
        import aiohttp
        
        with patch('aiohttp.ClientSession') as mock_client:
            mock_client.return_value.__aenter__ = AsyncMock(
                side_effect=aiohttp.ClientError("Connection refused")
            )
            
            # Ne doit pas lever d'exception
            result = await emit_frek_presence(
                frek_id="FRK-TEST123456",
                track_id="track_network_error",
                source="archive",
                duration_seconds=60
            )
            
            # Doit retourner False (échec silencieux)
            assert result == False
    
    @pytest.mark.asyncio
    async def test_emit_handles_timeout_silently(self):
        """
        Test: Les timeouts ne doivent pas bloquer le player
        """
        import asyncio
        
        with patch('aiohttp.ClientSession') as mock_client:
            mock_client.return_value.__aenter__ = AsyncMock(
                side_effect=asyncio.TimeoutError()
            )
            
            result = await emit_frek_presence(
                frek_id="FRK-TEST123456",
                track_id="track_timeout",
                source="archive",
                duration_seconds=45
            )
            
            assert result == False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
