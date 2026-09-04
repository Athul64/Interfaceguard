"""
Windows-only fix. PyDriller clones repos into a temp folder; Windows
sometimes keeps a brief lock on Git's internal files right after a clone,
which makes Python's temp-dir cleanup throw a (harmless) PermissionError.
This patches shutil.rmtree, for the whole test session, to clear the
read-only bit and retry -- which is what Windows needs. macOS/Linux never
hit this, so this is a no-op there.
"""
import gc
import os
import shutil
import stat
import sys


def _remove_readonly(func, path, _exc_info):
    gc.collect()
    os.chmod(path, stat.S_IWRITE)
    func(path)


_original_rmtree = shutil.rmtree


def _patched_rmtree(path, *args, **kwargs):
    if sys.version_info >= (3, 12):
        kwargs.setdefault("onexc", _remove_readonly)
    else:
        kwargs.setdefault("onerror", _remove_readonly)
    return _original_rmtree(path, *args, **kwargs)


shutil.rmtree = _patched_rmtree