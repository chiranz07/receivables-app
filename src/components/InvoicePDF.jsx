import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        padding: 40,
        backgroundColor: '#fff',
        color: '#333'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottom: 2,
        borderBottomColor: '#2a3f50',
        paddingBottom: 10,
        marginBottom: 20
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2a3f50'
    },
    invoiceInfo: {
        textAlign: 'right'
    },
    section: {
        marginBottom: 15
    },
    addressSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    address: {
        width: '45%'
    },
    subHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#4a5568'
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRightWidth: 0,
        borderBottomWidth: 0
    },
    tableRow: {
        flexDirection: 'row'
    },
    tableColHeader: {
        width: '40%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#f8fafc',
        padding: 5
    },
    tableCol: {
        width: '40%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5
    },
    tableCellHeader: {
        fontSize: 9,
        fontWeight: 'bold'
    },
    tableCell: {
        fontSize: 9
    },
    textRight: {
        textAlign: 'right'
    },
    totalsSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20
    },
    totalsTable: {
        width: '40%'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3
    },
    totalLabel: {
        fontSize: 10
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    grandTotalRow: {
        borderTopWidth: 1,
        borderTopColor: '#cbd5e0',
        marginTop: 5,
        paddingTop: 5
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: 'bold'
    }
});

const InvoicePDF = ({ invoice, customer, entity }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.headerText}>{entity?.name || 'Entity'}</Text>
                <View style={styles.invoiceInfo}>
                    <Text style={styles.headerText}>{invoice.type?.toUpperCase() || 'INVOICE'}</Text>
                    <Text>{invoice.invoiceNumber}</Text>
                    <Text>Date: {invoice.invoiceDate}</Text>
                    <Text>Due: {invoice.dueDate}</Text>
                </View>
            </View>

            <View style={styles.addressSection}>
                <View style={styles.address}>
                    <Text style={styles.subHeader}>Billed From:</Text>
                    <Text>{entity?.name}</Text>
                    <Text>{entity?.address?.line1}</Text>
                    <Text>{entity?.address?.city}, {entity?.address?.state} - {entity?.address?.pincode}</Text>
                    <Text>GSTIN: {entity?.gstin || 'N/A'}</Text>
                </View>
                <View style={styles.address}>
                    <Text style={styles.subHeader}>Billed To:</Text>
                    <Text>{customer?.name}</Text>
                    <Text>{customer?.address?.line1}</Text>
                    <Text>{customer?.address?.city}, {customer?.address?.state} - {customer?.address?.pincode}</Text>
                    <Text>GSTIN: {customer?.gstin || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.tableRow}>
                    <View style={{ ...styles.tableColHeader, width: '40%' }}><Text style={styles.tableCellHeader}>Description</Text></View>
                    <View style={{ ...styles.tableColHeader, width: '15%', ...styles.textRight }}><Text style={styles.tableCellHeader}>Quantity</Text></View>
                    <View style={{ ...styles.tableColHeader, width: '15%', ...styles.textRight }}><Text style={styles.tableCellHeader}>Rate</Text></View>
                    <View style={{ ...styles.tableColHeader, width: '15%', ...styles.textRight }}><Text style={styles.tableCellHeader}>GST</Text></View>
                    <View style={{ ...styles.tableColHeader, width: '15%', ...styles.textRight }}><Text style={styles.tableCellHeader}>Amount</Text></View>
                </View>
                {invoice.items.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                    <View style={{ ...styles.tableCol, width: '40%' }}><Text style={styles.tableCell}>{item.description}</Text></View>
                    <View style={{ ...styles.tableCol, width: '15%', ...styles.textRight }}><Text style={styles.tableCell}>{item.quantity}</Text></View>
                    <View style={{ ...styles.tableCol, width: '15%', ...styles.textRight }}><Text style={styles.tableCell}>{Number(item.rate).toFixed(2)}</Text></View>
                    <View style={{ ...styles.tableCol, width: '15%', ...styles.textRight }}><Text style={styles.tableCell}>{item.gstRate}%</Text></View>
                    <View style={{ ...styles.tableCol, width: '15%', ...styles.textRight }}><Text style={styles.tableCell}>{(item.quantity * item.rate).toFixed(2)}</Text></View>
                </View>
                ))}
            </View>

            <View style={styles.totalsSection}>
                <View style={styles.totalsTable}>
                    <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal:</Text><Text style={styles.totalValue}>₹{invoice.taxableTotal?.toFixed(2)}</Text></View>
                    {invoice.totalDiscount > 0 && <View style={styles.totalRow}><Text style={styles.totalLabel}>Discount:</Text><Text style={styles.totalValue}>-₹{invoice.totalDiscount?.toFixed(2)}</Text></View>}
                    {invoice.cgst > 0 && <View style={styles.totalRow}><Text style={styles.totalLabel}>CGST:</Text><Text style={styles.totalValue}>₹{invoice.cgst?.toFixed(2)}</Text></View>}
                    {invoice.sgst > 0 && <View style={styles.totalRow}><Text style={styles.totalLabel}>SGST:</Text><Text style={styles.totalValue}>₹{invoice.sgst?.toFixed(2)}</Text></View>}
                    {invoice.igst > 0 && <View style={styles.totalRow}><Text style={styles.totalLabel}>IGST:</Text><Text style={styles.totalValue}>₹{invoice.igst?.toFixed(2)}</Text></View>}
                    <View style={{ ...styles.totalRow, ...styles.grandTotalRow }}><Text style={styles.grandTotalLabel}>Total:</Text><Text style={styles.grandTotalLabel}>₹{invoice.total?.toFixed(2)}</Text></View>
                </View>
            </View>
        </Page>
    </Document>
);

export default InvoicePDF;