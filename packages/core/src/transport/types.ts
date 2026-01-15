/**
 * Transport Handler Interface
 * Responsible for fetching resource content from various sources
 */

export interface TransportHandler {
  /**
   * Transport type name (e.g., "https", "file")
   */
  readonly type: string;

  /**
   * Fetch resource content from the given location
   * @param location - The location string after ://
   * @returns Raw content as Buffer
   */
  fetch(location: string): Promise<Buffer>;
}
