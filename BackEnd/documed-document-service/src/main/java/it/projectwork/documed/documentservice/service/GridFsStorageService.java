package it.projectwork.documed.documentservice.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import it.projectwork.documed.documentservice.error.DocumentStorageException;
import it.projectwork.documed.documentservice.error.ResourceNotFoundException;

/**
 * Small explicit boundary around MongoDB GridFS binary operations.
 */
@Service
public class GridFsStorageService {

    private final GridFsTemplate gridFsTemplate;

    public GridFsStorageService(GridFsTemplate gridFsTemplate) {
        this.gridFsTemplate = gridFsTemplate;
    }

    /**
     * Stores validated bytes and returns the GridFS object identifier.
     */
    public String store(byte[] content, String filename, String contentType) {
        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(content)) {
            Document gridMetadata = new Document()
                    .append("contentType", contentType)
                    .append("fileSize", content.length);
            ObjectId id = gridFsTemplate.store(
                    inputStream, filename, contentType, gridMetadata);
            return id.toHexString();
        } catch (IOException | RuntimeException exception) {
            throw new DocumentStorageException(
                    "DOCUMENT_CONTENT_STORE_ERROR",
                    "Impossibile salvare il contenuto del documento",
                    exception);
        }
    }

    /**
     * Loads all bytes for a metadata record. Files are limited to 10 MB by the
     * upload policy, so buffering keeps controller resource handling simple.
     */
    public byte[] load(String gridFsFileId) {
        ObjectId objectId = parseObjectId(gridFsFileId);
        GridFSFile file = gridFsTemplate.findOne(
                Query.query(Criteria.where("_id").is(objectId)));
        if (file == null) {
            throw new ResourceNotFoundException(
                    "DOCUMENT_CONTENT_NOT_FOUND", "Contenuto del documento non trovato");
        }
        try {
            GridFsResource resource = gridFsTemplate.getResource(file);
            return StreamUtils.copyToByteArray(resource.getInputStream());
        } catch (IOException | RuntimeException exception) {
            throw new DocumentStorageException(
                    "DOCUMENT_CONTENT_READ_ERROR",
                    "Impossibile leggere il contenuto del documento",
                    exception);
        }
    }

    /**
     * Removes a GridFS file. Deleting an already absent identifier is safe and
     * allows a failed metadata deletion to be retried.
     */
    public void delete(String gridFsFileId) {
        try {
            gridFsTemplate.delete(Query.query(
                    Criteria.where("_id").is(parseObjectId(gridFsFileId))));
        } catch (RuntimeException exception) {
            throw new DocumentStorageException(
                    "DOCUMENT_CONTENT_DELETE_ERROR",
                    "Impossibile eliminare il contenuto del documento",
                    exception);
        }
    }

    private ObjectId parseObjectId(String value) {
        try {
            return new ObjectId(value);
        } catch (IllegalArgumentException exception) {
            throw new DocumentStorageException(
                    "INVALID_GRIDFS_FILE_ID",
                    "Identificativo GridFS non valido",
                    exception);
        }
    }
}
