#ifndef __BCD_H_INCLUDE
#define __BCD_H_INCLUDE

#include <asm/types.h>

// macro for creating BCD constants
#define BCD_HEX(v) ((BCD)(v))

/** Converts an integer value into BCD format

    A maximum of 8 digits may be used
*/
#define MAKE_BCD(v) BCD_HEX(0x ## v)

typedef unsigned long BCD;

/** Converts integer __i__ into BCD format (Binary Coded Decimal)
    @param i      Numeric value to convert
    @param value  Pointer to a BCD variable to store the converted result
*/
void uint2bcd(unsigned int i, BCD * value);

/** Adds two numbers in BCD format: __sour__ += __value__
    @param sour   Pointer to a BCD value to add to (and where the result is stored)
    @param value  Pointer to the BCD value to add to __sour__
*/
void bcd_add(BCD * sour, const BCD * value);

/** Subtracts two numbers in BCD format: __sour__ -= __value__
    @param sour   Pointer to a BCD value to subtract from (and where the result is stored)
    @param value  Pointer to the BCD value to subtract from __sour__
*/
void bcd_sub(BCD * sour, const BCD * value);

/** Convert a BCD number into an asciiz (null terminated) string and return the length
    @param bcd          Pointer to BCD value to convert
    @param tile_offset  Optional per-character offset value to add (use 0 for none)
    @param buffer       Buffer to store the result in

    Returns: Length in characters (always 8)

    __buffer__ should be large enough to store the converted string
    (9 bytes: 8 characters + 1 for terminator)

    There are a couple different ways to use __tile_offset__.
    For example:
    \li It can be the Index of the Font Tile '0'  in VRAM to
    allow the buffer to be used directly with @ref set_bkg_tiles.
    \li It can also be set to the ascii value for character '0'
    so that the buffer is a normal string that can be passed to @ref printf.
*/
UBYTE bcd2text(const BCD * bcd, UBYTE tile_offset, unsigned char * buffer);

#endif
