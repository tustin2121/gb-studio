/** @file string.h
    Generic string functions.
 */
#ifndef STRING_INCLUDE
#define STRING_INCLUDE

#include <types.h>

/** Copies the string pointed to by __src__ (including the terminating
    `\0' character) to the array pointed to by __dest__.

    The strings may not overlap, and the destination string dest must
    be large enough to receive the copy.

    @param dest			Array to copy into
    @param src			Array to copy from

    @return 			A pointer to dest
*/
char *strcpy(char *dest, const char *src) NONBANKED;

/** Compares strings

    @param s1         First string to compare
    @param s2         Second string to compare

    Returns:
    \li > 0 if __s1__ > __s2__
    \li 0 if __s1__ == __s2__
    \li < 0 if __s1__ < __s2__
*/
int strcmp(const char *s1, const char *s2) NONBANKED;

/** Copies n bytes from memory area src to memory area dest.

    The memory areas may not overlap.

    @param dest			Buffer to copy into
    @param src			Buffer to copy from
    @param len			Number of Bytes to copy
*/
void *memcpy(void *dest, const void *src, size_t len) NONBANKED;

/** Fills the memory region __s__ with __n__ bytes using value __c__

    @param s         Buffer to fill
    @param c         char value to fill with (truncated from int)
    @param n         Number of bytes to fill
*/
void *memset (void *s, int c, size_t n);

/** Reverses the characters in a string

    @param s         Pointer to string to reverse.

    For example 'abcdefg' will become 'gfedcba'.

    Banked as the string must be modifiable.

    Returns: Pointer to __s__
*/
char *reverse(char *s);

/** Concatenate Strings. Appends string __s2__ to the end of string __s1__

    @param s1         String to append onto
    @param s2         String to copy from

    For example 'abc' and 'def' will become 'abcdef'.

    String __s1__ must be large enough to store both __s1__ and __s2__.

    Returns: Pointer to __s1__
*/
char *strcat(char *s1, const char *s2) NONBANKED;

/** Calculates the length of a string

    @param s         String to calculate length of

    Returns: Length of string not including the terminating `\0' character.
*/
int strlen(const char *s) NONBANKED;

/**Concatenate at most __n__ characters from string __s2__ onto the end of __s1__.

    @param s1         String to append onto
    @param s2         String to copy from
    @param n          Max number of characters to copy from __s2__

    String __s1__ must be large enough to store both __s1__ and __n__ characters of __s2__

    Returns: Pointer to __s1__
*/
char *strncat(char *s1, const char *s2, int n) NONBANKED;

/** Compare strings (at most n characters):

    @param s1         First string to compare
    @param s2         Second string to compare
    @param n          Max number of characters to compare

    Returns:
    \li > 0 if __s1__ > __s2__
    \li 0 if __s1__ == __s2__
    \li < 0 if __s1__ < __s2__
*/
int strncmp(const char *s1, const char *s2, int n) NONBANKED;

/** Copy __n__ characters from string __s2__ to __s1__


    @param s1         String to copy into
    @param s2         String to copy from
    @param n          Max number of characters to copy from __s2__

    If __s2__ is shorter than __n__, the remaining
    bytes in __s1__ are filled with \0.

    Warning: If there is no \0 in the first __n__ bytes of __s2__ then __s1__
    will not be null terminated.

    Returns: Pointer to __s1__
*/
char *strncpy(char *s1, const char *s2, int n) NONBANKED;

#endif
