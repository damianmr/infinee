type FutureProofDataTransferItem = DataTransferItem & { getAsEntry?: () => void };

/**
 * Wrapper around webkitGetAsEntry to make it future proof.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry
 * @param transferItem an entry in a DataTransferItemList object.
 */
export default function getAsEntry(transferItem: FutureProofDataTransferItem) {
  if (transferItem.getAsEntry) {
    return transferItem.getAsEntry();
  }
  return transferItem.webkitGetAsEntry();
}
